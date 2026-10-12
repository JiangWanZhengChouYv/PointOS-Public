#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

/// 开机自启开关。自定义命令不走插件 ACL，所以悬浮球不需要 npm 版的插件 JS API。
#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    let autostart = app.autolaunch();
    if enabled {
        autostart.enable()
    } else {
        autostart.disable()
    }
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_autostart(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|error| error.to_string())
}

/// WebView 里 target=_blank 不会开新窗口，下载链接得交给系统浏览器
#[tauri::command]
fn open_url(app: AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|error| error.to_string())
}

/// 导出：系统保存对话框 + 写文本。放在 Rust 侧做，网页侧不用申请 dialog/fs 权限。
/// 参数一律单词命名，避开 JS 侧 camelCase / snake_case 转换的不确定性。
#[tauri::command]
async fn save_text_file(
    app: AppHandle,
    name: String,
    contents: String,
) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_file_name(&name)
        .add_filter("JSON", &["json"])
        .blocking_save_file();

    let Some(path) = picked else {
        return Ok(None);
    };

    let path = path.into_path().map_err(|error| error.to_string())?;
    std::fs::write(&path, contents).map_err(|error| error.to_string())?;
    Ok(Some(path.display().to_string()))
}

/// 导入：系统打开对话框 + 读文本
#[tauri::command]
async fn open_text_file(app: AppHandle) -> Result<Option<String>, String> {
    let Some(path) = app
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };

    let path = path.into_path().map_err(|error| error.to_string())?;
    let bytes = std::fs::read(&path).map_err(|error| error.to_string())?;
    String::from_utf8(bytes)
        .map_err(|error| error.to_string())
        .map(Some)
}

/// NSWindowCollectionBehavior 里的两个标志位（Apple 头文件里的枚举常量值）
const NS_CAN_JOIN_ALL_SPACES: isize = 1 << 0;
const NS_FULL_SCREEN_AUXILIARY: isize = 1 << 8;

/// macOS 上别的全屏 App 占据独立 Space，缺 FullScreenAuxiliary 就进不去那个 Space，
/// 球会被 PPT/希沃的全屏盖住。tao 的 set_visible_on_all_workspaces 只设了
/// CanJoinAllSpaces（tao-0.37.1 macos/window.rs:1537），所以这里补上另一个。
#[cfg(target_os = "macos")]
fn make_ball_float_above_fullscreen(app: &AppHandle) {
    let Some(widget) = app.get_webview_window("widget") else {
        return;
    };

    let result = widget.with_webview(move |platform| {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;

        unsafe {
            let ns_window = platform.ns_window() as *mut AnyObject;
            if ns_window.is_null() {
                return;
            }
            let current: isize = msg_send![ns_window, collectionBehavior];
            let next = current | NS_CAN_JOIN_ALL_SPACES | NS_FULL_SCREEN_AUXILIARY;
            let _: () = msg_send![ns_window, setCollectionBehavior: next];
        }
    });

    if let Err(error) = result {
        eprintln!("悬浮球全屏覆盖标志位设置失败: {error}");
    }
}

#[cfg(not(target_os = "macos"))]
fn make_ball_float_above_fullscreen(_app: &AppHandle) {}

fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// 首次运行默认打开开机自启；用户之后在设置里关掉，标记文件会阻止再次打开
fn ensure_first_run_autostart(app: &AppHandle) {
    let Ok(dir) = app.path().app_data_dir() else {
        return;
    };
    let marker = dir.join(".autostart-default");
    if marker.exists() {
        return;
    }
    if app.autolaunch().enable().is_ok() {
        let _ = std::fs::create_dir_all(&dir);
        let _ = std::fs::write(&marker, b"1");
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            set_autostart,
            get_autostart,
            save_text_file,
            open_text_file,
            open_url
        ])
        // 主窗口点红叉只是隐藏：悬浮球要常驻，数据桥也挂在这个窗口的 JS 上
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            ensure_first_run_autostart(&app.handle());

            let open_main = MenuItem::with_id(app, "open-main", "打开主界面", true, None::<&str>)?;
            let toggle_widget =
                MenuItem::with_id(app, "toggle-widget", "显示 / 隐藏悬浮球", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_main, &toggle_widget, &quit])?;

            let icon = app
                .default_window_icon()
                .ok_or("应用图标缺失，检查 bundle.icon")?
                .clone();

            TrayIconBuilder::with_id("score-tray")
                .icon(icon)
                .tooltip("班级积分管理系统")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open-main" => show_main(app),
                    // 可见性只由设置项决定：托盘把切换交给主窗口改设置，
                    // 否则托盘隐藏之后，设置里任何一次改动都会又把球弹出来
                    "toggle-widget" => {
                        let _ = app.emit_to("main", "widget:toggle-from-tray", ());
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            make_ball_float_above_fullscreen(&app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to start class score desktop");
}

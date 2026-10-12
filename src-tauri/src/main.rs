#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

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
        .invoke_handler(tauri::generate_handler![set_autostart, get_autostart])
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
                    "toggle-widget" => {
                        if let Some(widget) = app.get_webview_window("widget") {
                            if widget.is_visible().unwrap_or(false) {
                                let _ = widget.hide();
                            } else {
                                let _ = widget.show();
                                let _ = widget.set_focus();
                            }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to start class score desktop");
}

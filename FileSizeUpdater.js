/**
 * 文件大小比较更新机制
 * 通过比较源文件和目标文件的大小来决定是否执行更新操作
 */

class FileSizeUpdater {
  constructor() {
    this.logger = new FileSizeLogger();
  }

  /**
   * 获取本地文件大小
   * @param {string} filePath - 文件路径
   * @returns {Promise<number>} 文件大小（字节）
   */
  async getLocalFileSize(filePath) {
    try {
      // 在浏览器环境中，使用 File API
      if (typeof window !== 'undefined' && window.File && window.FileReader) {
        // 这里需要传入 File 对象，而不是文件路径
        throw new Error('在浏览器环境中，需要传入 File 对象而不是文件路径');
      }
      // 在 Node.js 环境中
      else if (typeof require !== 'undefined') {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        return stats.size;
      }
      else {
        throw new Error('不支持的运行环境');
      }
    } catch (error) {
      this.logger.error(`获取本地文件大小失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 获取远程文件大小（通过 HTTP HEAD 请求）
   * @param {string} url - 文件 URL
   * @returns {Promise<number>} 文件大小（字节）
   */
  async getRemoteFileSize(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      if (!contentLength) {
        throw new Error('Content-Length 头信息不存在');
      }

      return parseInt(contentLength, 10);
    } catch (error) {
      this.logger.error(`获取远程文件大小失败: ${url}`, error);
      throw error;
    }
  }

  /**
   * 获取文件大小（自动判断本地或远程）
   * @param {string} file - 文件路径或 URL
   * @returns {Promise<number>} 文件大小（字节）
   */
  async getFileSize(file) {
    try {
      // 判断是否为 URL
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return await this.getRemoteFileSize(file);
      }
      // 否则视为本地文件
      else {
        return await this.getLocalFileSize(file);
      }
    } catch (error) {
      this.logger.error(`获取文件大小失败: ${file}`, error);
      throw error;
    }
  }

  /**
   * 比较两个文件大小
   * @param {number} sourceSize - 源文件大小（字节）
   * @param {number} targetSize - 目标文件大小（字节）
   * @returns {Object} 比较结果
   */
  compareFileSizes(sourceSize, targetSize) {
    try {
      const result = {
        sourceSize,
        targetSize,
        sourceBigger: sourceSize > targetSize,
        targetBigger: targetSize > sourceSize,
        equal: sourceSize === targetSize
      };

      this.logger.info(`文件大小比较结果: 源文件 ${sourceSize} 字节, 目标文件 ${targetSize} 字节`, result);
      return result;
    } catch (error) {
      this.logger.error('文件大小比较失败', error);
      throw error;
    }
  }

  /**
   * 决定是否执行更新
   * @param {number} sourceSize - 源文件大小（字节）
   * @param {number} targetSize - 目标文件大小（字节）
   * @returns {boolean} 是否执行更新
   */
  shouldUpdate(sourceSize, targetSize) {
    const comparison = this.compareFileSizes(sourceSize, targetSize);
    const shouldUpdate = comparison.sourceBigger;
    
    this.logger.info(`更新决策: ${shouldUpdate ? '执行更新' : '不执行更新'}`);
    return shouldUpdate;
  }

  /**
   * 执行完整的文件大小比较和更新决策
   * @param {string} source - 源文件路径或 URL
   * @param {string} target - 目标文件路径或 URL
   * @returns {Promise<{shouldUpdate: boolean, comparison: Object}>} 更新决策和比较结果
   */
  async execute(source, target) {
    try {
      const startTime = performance.now();
      
      this.logger.info(`开始文件大小比较: 源文件 ${source}, 目标文件 ${target}`);
      
      const [sourceSize, targetSize] = await Promise.all([
        this.getFileSize(source),
        this.getFileSize(target)
      ]);
      
      const comparison = this.compareFileSizes(sourceSize, targetSize);
      const shouldUpdate = this.shouldUpdate(sourceSize, targetSize);
      
      const endTime = performance.now();
      this.logger.info(`文件大小比较完成，耗时 ${(endTime - startTime).toFixed(2)}ms`);
      
      return {
        shouldUpdate,
        comparison
      };
    } catch (error) {
      this.logger.error('执行文件大小比较失败', error);
      throw error;
    }
  }
}

/**
 * 文件大小比较日志记录器
 */
class FileSizeLogger {
  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  info(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] FileSizeUpdater: ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error} error - 错误对象
   */
  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] FileSizeUpdater: ${message}`;
    if (error) {
      console.error(logMessage, error);
    } else {
      console.error(logMessage);
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileSizeUpdater;
  module.exports.FileSizeLogger = FileSizeLogger;
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.FileSizeUpdater = FileSizeUpdater;
  window.FileSizeLogger = FileSizeLogger;
}

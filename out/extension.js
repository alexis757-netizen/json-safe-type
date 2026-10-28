"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// 脱敏与生成类型的核心逻辑
function processJson(text) {
    try {
        const data = JSON.parse(text);
        // 1. 定义假数据替换规则（正则）
        const scrub = (obj) => {
            if (typeof obj === 'string') {
                // 把邮箱替换成假邮箱
                if (obj.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/))
                    return 'user@example.com';
                // 把11位手机号替换成假手机号
                if (obj.match(/^1[3-9]\d{9}$/))
                    return '13800138000';
                // 把身份证号替换
                if (obj.match(/^\d{15}|\d{18}$/))
                    return '110101199001011234';
                return obj;
            }
            if (Array.isArray(obj))
                return obj.map(scrub);
            if (obj !== null && typeof obj === 'object') {
                const newObj = {};
                for (const key in obj)
                    newObj[key] = scrub(obj[key]);
                return newObj;
            }
            return obj;
        };
        const scrubbedData = scrub(data);
        // 2. 根据 JSON 生成 TypeScript 类型
        let tsType = `export interface RootData {\n`;
        for (const key in scrubbedData) {
            let typeStr = typeof scrubbedData[key];
            if (typeStr === 'string')
                typeStr = 'string';
            if (typeStr === 'number')
                typeStr = 'number';
            if (typeStr === 'boolean')
                typeStr = 'boolean';
            if (Array.isArray(scrubbedData[key]))
                typeStr = 'any[]';
            if (typeStr === 'object')
                typeStr = 'any';
            tsType += `  ${key}: ${typeStr};\n`;
        }
        tsType += `}\n\n`;
        // 3. 把两部分结果拼在一起
        return `${tsType}\n// 以下是脱敏后的安全 JSON 数据:\nconst safeData = ${JSON.stringify(scrubbedData, null, 2)};`;
    }
    catch (error) {
        return `// 错误：选中的文本不是合法的 JSON 格式\n// 详情：${error}`;
    }
}
function activate(context) {
    // 注册一个名叫 "jsonSafe.generate" 的命令
    let disposable = vscode.commands.registerCommand('jsonSafe.generate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('请先打开一个文件并选中 JSON 数据！');
            return;
        }
        // 获取用户选中的文本
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text) {
            vscode.window.showInformationMessage('请先用鼠标选中一段 JSON 数据！');
            return;
        }
        // 处理文本并替换到编辑器里
        const result = processJson(text);
        editor.edit((editBuilder) => {
            editBuilder.replace(selection, result);
        });
        vscode.window.showInformationMessage('✅ 脱敏与类型生成完成！');
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
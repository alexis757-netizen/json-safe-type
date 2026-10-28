import * as vscode from 'vscode';

// 脱敏与生成类型的核心逻辑
function processJson(text: string): string {
    try {
        const data = JSON.parse(text);
        
        // 1. 定义假数据替换规则（正则）
        const scrub = (obj: any): any => {
            if (typeof obj === 'string') {
                // 把邮箱替换成假邮箱
                if (obj.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) return 'user@example.com';
                // 把11位手机号替换成假手机号
                if (obj.match(/^1[3-9]\d{9}$/)) return '13800138000';
                // 把身份证号替换
                if (obj.match(/^\d{15}|\d{18}$/)) return '110101199001011234';
                return obj;
            }
            if (Array.isArray(obj)) return obj.map(scrub);
            if (obj !== null && typeof obj === 'object') {
                const newObj: any = {};
                for (const key in obj) newObj[key] = scrub(obj[key]);
                return newObj;
            }
            return obj;
        };

        const scrubbedData = scrub(data);

        // 2. 根据 JSON 生成 TypeScript 类型
        let tsType = `export interface RootData {\n`;
        for (const key in scrubbedData) {
            let typeStr : string= typeof scrubbedData[key];
            if (typeStr === 'string') typeStr = 'string';
            if (typeStr === 'number') typeStr = 'number';
            if (typeStr === 'boolean') typeStr = 'boolean';
            if (Array.isArray(scrubbedData[key])) typeStr = 'any[]';
            if (typeStr === 'object') typeStr = 'any';
            tsType += `  ${key}: ${typeStr};\n`;
        }
        tsType += `}\n\n`;

        // 3. 把两部分结果拼在一起
        return `${tsType}\n// 以下是脱敏后的安全 JSON 数据:\nconst safeData = ${JSON.stringify(scrubbedData, null, 2)};`;

    } catch (error) {
        return `// 错误：选中的文本不是合法的 JSON 格式\n// 详情：${error}`;
    }
}

export function activate(context: vscode.ExtensionContext) {
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

export function deactivate() {}
import * as vscode from 'vscode'
import hjson from 'hjson'

const output = vscode.window.createOutputChannel(
    'Hjson vsc',
    { log: true }
)
let formatOptions = {}

function getOptions() {
    const config = vscode.workspace.getConfiguration('hjson-vsc')

    formatOptions = {
        condense: config.get('condense'),
        bracesSameLine: config.get('bracesSameLine'),
        emitRootBraces: config.get('emitRootBraces'),
        quotes: config.get('quotes'),
        multiline: config.get('multiline'),
        separator: config.get('separator'),
        space: config.get('space'),
        eol: config.get('eol'),
        colors: config.get('colors'),
        serializeDeterministically: config.get('serializeDeterministically')
    }

    output.info('getOptions: ' + JSON.stringify(formatOptions))
}

vscode.workspace.onDidChangeConfiguration(getOptions)

getOptions()

export function activate(context) {
    output.info('activate')

    const format = (
        document,
        options
    ) => {
        // set default eol by current document
        const documentEol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
        formatOptions.eol =
            !formatOptions.eol || formatOptions.eol === 'auto'
                ? documentEol
                : formatOptions.eol

        // set indents size
        formatOptions.space =
            !formatOptions.space || formatOptions.space === 'auto'
                ? options.tabSize
                : formatOptions.space

        const result = []

        const start = new vscode.Position(0, 0)
        const end = new vscode.Position(
            document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length
        )
        const range = new vscode.Range(start, end)
        const s = document.getText(range)
        try {
            hjson.setEndOfLine(formatOptions.eol)
            const parsed = hjson.rt.parse(s)
            const formattedText = hjson.rt.stringify(parsed, formatOptions)
            result.push(new vscode.TextEdit(range, formattedText))
            return result
        } catch (e) {
            vscode.window.showErrorMessage(
                'Formatted document failed, please check your syntax'
            )
            console.error(e)
        }
    }
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('hjson', {
            provideDocumentFormattingEdits(document, options, token) {
                return format(document, options)
            }
        })
    )
}

export function deactivate() { }

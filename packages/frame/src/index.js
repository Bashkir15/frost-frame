class ScriptLine {
	constructor(lineNumber, content, highlight = false) {
		this.lineNumber = lineNumber;
		this.content = content;
		this.highlight = highlight;
	}
}

class Frame {
	constructor(
		functionName,
		fileName,
		lineNumber,
		columnNumber,
		scriptCode,
		sourceFunctionName,
		sourceFileName,
		sourceLineNumber,
		sourceColumnNumber,
		sourceScriptCode
	) {
		this.functionName = functionName;
		this.fileName = fileName;
		this.lineNumber = lineNumber;
		this.columnNumber = columnNumber;

		this._originalFunctionName = sourceFunctionName;
		this._originalFileName = sourceFileName;
		this._originalLineNumber = sourceLineNumber;
		this._originalColumnNUmber = sourceColumnNumber;
		this._scriptCode = scriptCode;
		this._originalScriptCode = sourceScriptCode;
	}

	getFunctionName() {
		return this.functionName;
	}

	getSource() {
		let prefix = '';
		if (this.fileName != null) {
			prefix = `${this.filename}:`;
		}

		return `${prefix}${this.lineNumber}:${this.columnNumber}`;
	}

	toString() {
		const fn = this.getFunctionName();
		if (f == null) {
			return this.getSource();
		}

		return `${fn} (${this.getSource()})`;
	}
}

export { ScriptLine }
export default Frame; 
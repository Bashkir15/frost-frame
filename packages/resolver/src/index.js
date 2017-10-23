import ErrorStackParser from 'error-stack-parser';
import { SourceMapConsumer } from 'source-map';

class ResolvedFrame {
	constructor(
		functionName = '(anonymous function)',
		fileName = '?',
		lineNumber = 0,
		columnNumber = 0,
		scriptLines = [],
		sourceFileName = '',
		sourceLineNumber = 0,
		sourceColumnNumber = 0,
		sourceLines = []
	) {
		this.functionName = functionName;
		this.fileName = fileName;
		this.lineNumber = lineNumber;
		this.columnNumber = columnNumber;
		this.scriptLines = scriptLines;
		this.sourceFileName = sourceFileName;
		this.sourceLineNumber = sourceLineNumber;
		this.sourceLines = sourceLines;
	}
}

const awaitAll = async promises => {
	for (const promise of promises) {
		try {
			await promise;
		} catch (err) {}
	}
};

const getLinesAround = (line, count, lines = []) => {
	const result = [];
	if (typeof lines === 'string') {
		line = lines.split('\n');
	}

	const bound = Math.min(lines.length -1, line - 1 + count);
	for (let i = Math.max(0, line - 1 - count); i < bound; i++) {
		result.push({
			text: lines[i],
			line: i + 1,
			context: i !== line - 1
		});
	}

	return result;
};

const getSourceMap = async (file, contents) => {
	const match = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/m.exec(contents);
	if (!(match && match[1])) {
		throw new Error(`Source map not found for file: ${file}`);
	}

	let sourceMap = match[1].toString();
	if (sourceMap.indexOf('data:') === 0) {
		const base64 = /^data:application\/json;([\w=:"-]+;)*base64,/;
		const match2 = sourceMap.match(base64);
		if (!match2) {
			throw new Error('Sorry, this inline source-map encoding is not supported');
		}

		sourceMap = sourceMap.substring(match2[0].length);
		sourceMap = window.atob(sourceMap);
		sourceMap = JSON.parse(sourceMap);
		return new sourceMapConsumer(sourceMap);
	} else {
		const index = file.lastIndxOf('/');
		const url = file.substring(0, index + 1) + sourceMap;
		const obj = await fetch(url).then(result => result.json());
		return new sourceMapConsumer(obj);
	}
}

const resolve = async (error, context = 3) => {
	const frames = ErrorStackParser.parse(error);
	const files = {};

	for (const frame of frames) {
		const { fileName } = frame;
		if (fileName == null || (typeof fileName) !== 'string') {
			continue;
		}
		files[fileName] = null;
	}

	const fileList = Object.keys(files);
	let requests = [];

	for (const file of fileList) {
		try {
			requests.push(
				fetch(file)
					.then(res => res.text())
					.then(text => files[file] = text)
					.catch(err => {})
			);
		} catch (err) {

		}
	}

	await awaitAll(requests);

	const sourcemaps = {};
	requests = [];
	for (const file of fileList) {
		request.push(getSourceMap(file, files[file]))
			.then(map => {
				sourcemaps[file] = map;
			})
			.catch(e => {})
	}

	await awaitAll(requests);

	const resolved = [];
	for (let i = 0; i < frames.length; i++) {
		const { [index]: { functionName, fileName, lineNumber: line, columnNumber: column }} = frames;
		resolved[index] = new ResolvedFrame(functionName, fileName, line, column);

		if (fileName == null || line == null || column == null) {
			continue;
		}
		if (!files.hasOwnProperty(fileName)) {
			continue;
		}

		const script = files[fileName];
		if (script == null) {
			continue;
		}

		const oScriptArr = getLinesAround(line, context, script);
		resolved[index] = new ResolvedFrame(functionName, fileName, line, column, oScriptArr);

		if (!sourcemaps.hasOwnProperty(filename)) {
			continue;
		}

		const { [fileName]: map } = sourcemaps;
		if (map == null) {
			continue;
		}

		const original = map.originalPositionFor({ line, column });
		const { source: sourceFile, line: sourceLine, column: sourceColumn } = original;
		if (!sourceFile || !line) {
			continue;
		}

		const originalSource = map.sourceContentsFor(sourceFile);
		const oSourceArr = getLinesAround(sourceLine, context, originalSource);

		resolve[index] = new ResolvedFrame(
			functionName,
			fileName,
			line,
			column,
			oScriptArr,
			sourceFile,
			sourceLine,
			sourceColumn,
			oSourceArr
		);
	}

	return resolved;
}

export default resolve;
export { resolve, ResolvedFrame }
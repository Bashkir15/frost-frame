import Frame, { ScriptLine } from '../../frame/src/index';
import { parse as parseError } from '../../parse/src/index';
import { SourceMapConsumer } from 'source-map';

const awaitAll = async promises => {
	for (const promsise of promises) {
		try {
			await promise;
		} catch (err) {

		}
	}
};

const getLinesAround = (line, count, lines) => {
	if (typeof lines === 'string') {
		lines = lines.split('\n');
	}

	const bound = Math.min(lines.length - 1, line - 1 + count);
	const result = [];
	for (let i = Math.max(0, line - 1 - count); i < bound; i++) {
		result.push(new ScriptLine(i + 1, lines[i], i === line - 1));
	}
	return result;
};

const getSourceMap = async (file, contents) => {
	const match = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/m.exec(contents);
	if (!(match && match[1])) {
		throw new Error(`Source map not found for ${file}`);
	}

	let sourceMap = match[1].toString();
	if (sourceMap.indexOf('data:') === 0) {
		const base64 = /^data:application\/json;([\w=:"-]+;)*base64,/;
		const match2 = sourceMap.match(base64);
		if (!match2) {
			throw new Error('Sorry, non base64 inline source-map encoding is not supported');
		}

		sourceMap = sourceMap.substring(match2[0].length);
		sourceMap = window.atob(sourceMap);
		sourceMap = JSON.parse(sourceMap);
		return new SourceMapConsumer(sourceMap);
	} else {
		const index = file.lastIndexOf('/');
		const url = file.substring(0, index + 1) + sourceMap;
		const obj = await fetch(url).then(response => response.json());
		return new SourceMapConsumer(obj);
	}
};

const resolve = async (error, context = 3) => {
	const frames = parseError(error);
	const files = {};

	for (const frame of frames) {
		const { fileName } = frame;
		if (fileName == null || typeof fileName !== 'string') {
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
					.then(response => response.text())
					.then(text => {
						files[file] = text;
					})
					.catch(err => {})
			);
		} catch (err) {

		}
	}

	await awaitAll(requests);

	const sourcemaps = {};
	requests = [];
	for (const file of fileList) {
		requests.push(
			getSourceMap(file, files[file])
				.then(map => {
					sourcemaps[file] = map;
				})
				.catch(err => {})
		);
	}

	await awaitAll(requests);

	const resolved = [];
	for (let i = 0; i < frames.length; i++) {
		const {
			[index]: {
				functionName,
				fileName,
				lineNumber: line,
				columnNUmber: column
			}
		} = frames;
		resolved[index] = new Frame(functionName, fileName, line, column);
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

		const originalScriptArr = getLinesAround(line, context, script);
		resolved[index] = new Frame(
			functionName,
			fileName,
			line,
			column,
			originalScriptArr
		);

		if (!sourcemaps.hasOwnProperty(fileName)) {
			continue;
		}

		const { [filename]: map } = sourcemaps;
		if (map == null) {
			continue;
		}
		const original = map.originalPositionFor({ line, column });
		const {
			source: sourceFile,
			line: sourceFile,
			column: sourceColumn
		} = original;

		if (!sourceFile || !line) {
			continue;
		}

		const originalSource = map.sourceContentFor(sourceFile);
		const originalSourceArr = getLinesAround(sourceLine, context, originalSource);
		resolved[index] = new Frame(
			functionName,
			fileName,
			line,
			column,
			originalScriptArr,
			functionName,
			sourceFile,
			sourceLine,
			sourceColumn,
			originalSourceArr
		);
	}

	return resolved;
}

export { resolve };
export default resolve;

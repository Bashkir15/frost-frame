import codeFrame from 'babel-code-frame';
import chalk from 'chalk';
import { wrapCallSite } from 'source-map-support';
import { readFileSync } from 'fs';

const FunctionNameFilter = [ /__webpack_require__/ ];
const SourceFileFilter = [ /\/webpack\/bootstrap/ ];
const FunctionNameClearance = [ /__webpack_exports__/ ];
const TypeNameClearance = [ /^Object$/ ];
const CodeFrameOptions = {
	highlightCode: true
};

/**
 * Cleans up the source file name which was modified by 'source-map-support'
 *
 */

export const cleanSourceFileName = file => {
	let clean = file.split(':')[1] || file;
	if (clean.charAt(0) === '/') {
		clean = clean.slice(1);
	}

	return clean;
};

export const isRelevantFrame = frame => {
	const wrapped = wrapCallSite(frame);
	const generated = frame.getFileName();

	const sourceFile = wrapped.getFileName();
	const functionName = wrapped.getFunctionName();
	const isCompiled = sourceFile !== generated;

	if (!isCompiled) {
		return false;
	}

	if (FunctionNameFilter.some(exp => exp.test(functionName))) {
		return false;
	}
	if (SourceFileFilter.some(exp => exp.test(sourceFile))) {
		return false;
	}

	return true;
};

export const getRelevantFrames = frames => {
	return frames.filter(isRelevantFrame);
};

export const frameToString = frame => {
	const wrapped = wrapCallSite(frame);

	let sourceFile = wrapped.getFileName();
	let functionName = wrapped.getFunctionName();
	let typeName = wrapped.getTypeName();

	if (FunctionNameClearance.some(exp => exp.test(functionName))) {
		functionName = '';
	}
	if (TypeNameClearance.some(exp => exp.test(typeName))) {
		typeName = '';
	}

	sourceFile = cleanSourceFileName(sourceFile);

	const line = wrapped.getLineNumber();
	const column = wrapped.getColumnNumber();
	const ident = functionName || typeName || '<anonymous>';

	return `at ${ident}@${sourceFile}:${line}:${column}`;
};

export const prepareStackTrace = (nativeError, trace) => {
	const frames = getRelevantFrames(trace);
	const firstFrame = frames[0];

	if (firstFrame != null) {
		const wrappedFirst = wrapCallSite(firstFrame);
		const sourceFile = cleanSourceFileName(wrappedFirst.getFileName());
		let sourceText = '';

		try {
			sourceText = readFileSync(sourceFile, 'utf-8');
		} catch (err) {

		}

		if (sourceText) {
			const result = codeFrame(
				sourceText,
				wrappedFirst.getLineNumber(),
				wrappedFirst.getColumnNumber(),
				CodeFrameOptions
			);
			nativeError.code = result;
		}
	}

	return frames
		.map(frame => frameToString(frame))
		.filter(item => item != null)
		.join('\n');
};

export const highlightStack = stack => {
	return stack
		.split('\n')
		.map(line => {
			if (line.startsWith('at ')) {
				return line.replace(
					/(at )(.*?)(@)(.*?):([0-9]+)(:)([0-9]+)/,
					(match, intro, id, symbol, filename, lineNo, serparator, columnNo) =>
						`  -${chalk.white(id)} ${chalk.dim(filename)} [${chalk.yellow(lineNo)}:${chalk.yellow(columnNo)}] `
				);
			}
			return chalk.yellow(line);
		})
		.join('\n');
};

export const logError = err => {
	if (err instanceof Error) {
		String(err.stack);

		const formattedMessage = chalk.red(err.name + ':' + err.message);
		const formattedStack = highlightStack(err.stack);

		if (err.code) {
			console.error(`${formattedMessage}\n\n${err.code}\n\n${formattedStack}`);
		} else {
			console.error(`${formattedMessage}\n\n${formattedStack}`);
		}
	} else {
		console.error(err);
	}
};

export const enableEnhancedStackTrace = (debug = false) => {
	global.Promise = require('bluebird');
	Promise.config({
		longStackTraces: debug,
		warnings: debug
	});

	process.on('unhandledRejection', (reason, promise) => logError(reason));
	process.on('uncaughtException', error => logError(error));

	Error.prepareStackTrace = prepareStackTrace;

	console.log('Activated enhanced stack traces');
};

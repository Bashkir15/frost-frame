import Frame from '../../frame/src/index';
import getSourceMap from '../../utils/src/sourceMap';

const map = async (frames, fileUri, fileContents) => {
	if (fileContents == null) {
		fileContents = await fetch(fileUri)
			.then(response => response.text());
	}

	const map = await getSourceMap(fileUri, fileContent);
	return frames.map(frame => {
		const { functionName, fileName, lineNumber, columnNumber } = frame;
		const { source, line, column } = map.originalPositionFor({
			line: lineNumber,
			column: columnNumber
		});

		return new Frame(
			functionName,
			fileName,
			lineNumber,
			columnNumber,
			undefined,
			functionName,
			source,
			line,
			column,
			undefined
		);
	});
};

export { map };
export default map;
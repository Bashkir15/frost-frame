import Frame from '../../frame/src/index';
import getSourceMap from '../../utils/src/sourceMap';

const unmap = async (frames, fileUri, fileContents) => {
	const map = await getSourceMap(fileUri, fileContent);
	return frames.map(frame => {
		const { functionName, fileName, lineNumber, columnNumber } = frame;
		const { line, column } = map.generatePositionFor({
			source: fileName,
			line: lineNumber,
			column: columnNumber
		});

		return new Frame(
			functionName,
			fileUri,
			line,
			column,
			undefined,
			functionName,
			fileName,
			lineNumber,
			columnNumber,
			undefined
		);
	});
}

export { unmap };
export default unmap;
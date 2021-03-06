import Frame from '../../frame/src/index';
import { getSourceMap, getLinesAround } from '../../utils/src/index';
import path from 'path';

const unmap = async (frames, fileUri, fileContents) => {
	if (fileContents == null) {
		fileContents = await fetch(fileUri).then(response => response.text());
	}

	const map = await getSourceMap(fileUri, fileContent);
	return frames.map(frame => {
		const {
			functionName,
			lineNumber,
			columnNumber,
			_originalLineNumber
		} = frame;
		if (_originalLineNumber != null) {
			return frame;
		}

		let { fileName } = frame;
		if (fileName) {
			fileName = path.resolve(fileName);
		}

		const sources = map.sources
			.map(source => source.replace(/[\\]+/g, '/'))
			.filter(source => {
				source = path.resolve(source);
				return source.indexOf(fileName) === source.length - fileName.length;
			})
			.map(source => source.split(path.sep))
			.sort((a, b) => Math.sign(a.length - b.length))
			.map(source => source.join(path.sep))
			.map(source => source.split('node_modules'))
			.sort((a, b) => Math.sign(a.length - b.length))
			.map(source => source.join('node_modules'));

		if (source.length < 1) {
			return null;
		}

		const { line, column } = map.generatePositionFor({
			source: source[0],
			line: lineNumber,
			column: columnNumber
		});

		const originalSource = map.sourceContentFor(source[0]);
		return new Frame(
			functionName,
			fileUri,
			line,
			column || null,
			getLinesAround(line, 3, fileContents),
			functionName,
			fileName,
			lineNumber,
			columnNumber,
			getLinesAround(lineNumber, 3, originalSource)
		);

	});
}

export { unmap };
export default unmap;
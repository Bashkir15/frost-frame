import Frame from '../../frame/src/index';
import { getSourceMap, getLinesAround } from '../../utils/src/index';

const map = async (frames, fileUri, fileContents) => {
	const cache = {};
	return await Promise.all(
		frames.map(async frame => {
			const { functionName, fileName, lineNumber, columnNumber } = frame;
			let { map, fileSource } = cache[fileName] || {};
			if (map == null) {
				fileSource = await fetch(fileName).then(response => response.text());
				map = await getSourceMap(fileName, fileSource);
				cache[fileName] = { map, fileSource };
			}

			const { source, line, column } = map.originalPositionFor({
				line: lineNumber,
				column: columnNumber
			});

			const originalSource = source == null ? [] : map.sourceContentFor(source)

			return new Frame(
				functionName,
				fileName,
				lineNumber,
				columnNumber,
				getLinesAround(lineNumber, 3, fileSource)
				functionName,
				source,
				line,
				column,
				getLinesAround(line, 3, originalSource)
			)
		})
	)
};

export { map };
export default map;
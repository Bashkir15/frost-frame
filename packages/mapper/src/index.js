import Frame from '../../frame/src/index';
import getSourceMap from '../../utils/src/sourceMap';

const map = async (frames, fileUri, fileContents) => {
	const cache = {};
	return await Promise.all(
		frames.map(async frame => {
			const { functionName, fileName, lineNumber, columnNumber } = frame;
			let map = cache[fileName];
			if (map == null) {
				map[fileName] = await getSourceMap(
					fileName,
					await fetch(fileName).then(response => response.text());
				)
			}

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
			)
		})
	)
};

export { map };
export default map;
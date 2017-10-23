import { SourceMapConsumer } from 'source-map';

const getSourceMap = async (fileUri, fileContents) => {
	const match = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/m.exec(fileContents);
	if (!(match && match[1])) {
		throw new Error(`Soure map not found for file: ${fileUri}`);
	}

	let sourceMap = match[1].toString();
	if (sourceMap.indexOf('data:') === 0) {
		const base64 = /^data:application\/json;([\w=:"-]+;)*base64,/;
		const match2 = sourceMap.match(base64);
		if (!match2) {
			throw new Error('Sorry, non-base64 inline source-map encoding is not supported');
		}

		sourceMap = sourceMap.substring(match2[0].length);
		sourceMap = window.atob(sourceMap);
		sourceMap = JSON.parse(sourceMap);
		return new SourceMapConsumer(sourceMap);
	} else {
		const index = fileUri.lastIndexOf('/');
		const url = fileUri.substring(0, index + 1) + sourceMap;
		const obj = await fetch(url).then(response => response.json());
		return new SourceMapConsumer(obj);
	}
}

export { getSourceMap };
export default getSourceMap;
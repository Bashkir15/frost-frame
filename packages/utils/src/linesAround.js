import { ScriptLine } from '../../frame/src/index';

const getLinesAround = (line, count, lines) => {
	if (typeof lines === 'string') {
		lines = lines.split('\n');
	}

	const result = [];
	const bound = Math.min(lines.length - 1, line - 1 + count);

	for (let i = Math.max(0, line - 1 - count); i < bound; i++) {
		result.push(new ScriptLine(i + 1, lines[i], i === line - 1));
	}
	return result;
};

export { getLinesAround };
export default getLinesAround;

import Frame from '../../frame/src/index';

const locExpression = /\(?(.+?)(?:\:(\d+))?(?:\:(\d+))?\)?$/;
const chromeFrame = /^\s*at\s.+(:\d+)/;
const firefoxFrame = /(^|@)\S+\:\d+/;

const extractLocation = token => locExpression.exec(token).slice(1);
const parseStack = stack => {
	const frames = stack
		.split('\n')
		.filter(
			e => chromeFrame.test(e) || firefoxFrame.test(e)
		)
		.map(e => {
			if (firefoxFrame.test(e)) {
				const data = e.split(/[@]/g);
				const last = data.pop();
				return new Frame(
					data.join('@') || undefined,
					...extractLocation(last)
				);
			} else {
				const data = e
					.trim()
					.split(/\s+/g)
					.slice(1);
				const last = data.pop();
				return new Frame(
					data.join(' ') || undefined,
					...extractLocation(last)
				);
			}
		});
	return frames;
};

const parseError = error => {
	if (error == null || typeof error.stack !== 'string') {
		throw new Error('The error you provided does not contain a stack trace');
	}
	return parseStack(error.stack);
}

export { parseError as parse };
export default parseError;

import Frame from '../../frame/src/index';

const locExpression = /\(?(.+?)(?:\:(\d+))?(?:\:(\d+))?\)?$/;
const chromeFrame = /^\s*(at|in)\s.+(:\d+)/;
const firefoxFrame = /(^|@)\S+\:\d+|.+line\s+\d+\s+>\s+eval.+/;

const extractLocation = token => locExpression.exec(token).slice(1).map(item => {
	const place = Number(item);
	if (!isNaN(place)) {
		return place;
	}
	return item;
});

const parseStack = stack => {
	const frames = stack
		.split('\n')
		.filter(
			e => chromeFrame.test(e) || firefoxFrame.test(e)
		)
		.map(e => {
			if (firefoxFrame.test(e)) {
				// strip eval
				let isEval = false;
				if (e.indexOf(' > eval') > -1) {
					e = e.replace(
						/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1'
					);
					isEval = true;
				}
				if (e.indexOf('(at ') !== -1) {
					e = e.replace(/\(at /, '(');
				}
				const data = e.split(/[@]/g);
				const last = data.pop();
				return new Frame(
					data.join('@') || (isEval ? 'eval' : undefined),
					...extractLocation(last)
				);
			} else {
				if (e.indexOf('(eval ') !== -1) {
					e = e.replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '';)
				}
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

export function POST() {
	return {
		status: 302,
		headers: {
			location: '/shadowed/redirected'
		}
	};
}

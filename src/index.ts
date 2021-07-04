const world = 'world';

export function hello(w: string = world): string {
    return `Hello ${w}! `;
}

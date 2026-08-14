

const MAX_NAME_LENGTH = 255;
const MAX_DEPTH = 64;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isValidNode(node, depth) {
    if (!isPlainObject(node)) return false;
    if (node.type === 'dir') {
        if (node.content === undefined) return true;
        return isValidTree(node.content, depth + 1);
    }
    if (node.type === 'file') {
        return node.content === undefined || typeof node.content === 'string';
    }
    return false;
}

function isValidTree(tree, depth) {
    if (depth > MAX_DEPTH) return false;
    if (!isPlainObject(tree)) return false;
    for (const key of Object.keys(tree)) {
        if (FORBIDDEN_KEYS.has(key)) return false;
        if (key.length === 0 || key.length > MAX_NAME_LENGTH) return false;
        if (!isValidNode(tree[key], depth)) return false;
    }
    return true;
}

export function validateFileSystem(fileSystem) {
    return isValidTree(fileSystem, 0);
}

import dictionary from '@/data/i18n-ru-en.json';

const ATTRS = ['placeholder', 'title', 'aria-label', 'value'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const TEXT_ORIGINALS = new WeakMap();
const ATTR_ORIGINALS = new WeakMap();

const REPLACEMENTS = Object.entries(dictionary)
    .filter(([source, target]) => source && target && source !== target)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([source, target]) => [new RegExp(escapeRegExp(source), 'g'), target]);

const COMMON_WORD_REPLACEMENTS = [
    ['и', 'and'],
    ['в', 'in'],
    ['к', 'to'],
    ['с', 'with'],
    ['на', 'for'],
    ['по', 'by'],
    ['для', 'for'],
    ['или', 'or'],
    ['из', 'from'],
    ['при', 'when'],
].map(([source, target]) => [
    new RegExp(`(?<![\\u0400-\\u04FF\\d])${source}(?![\\u0400-\\u04FF\\d])`, 'g'),
    target,
]);

let currentLocale = 'ru';
let observer = null;
let isApplying = false;
let originalConfirm = null;
let originalAlert = null;
let originalPrompt = null;
let lastRuTitle = '';

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCyrillic(value) {
    return /[\u0400-\u04FF]/.test(value);
}

function shouldSkipElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return true;
    }

    if (SKIP_TAGS.has(element.tagName)) {
        return true;
    }

    return Boolean(element.closest('[data-no-locale-translate="true"]'));
}

function translateString(value) {
    if (!value || !hasCyrillic(value)) {
        return value;
    }

    let translated = value;
    for (const [pattern, replacement] of REPLACEMENTS) {
        translated = translated.replace(pattern, replacement);
    }

    if (hasCyrillic(translated)) {
        for (const [pattern, replacement] of COMMON_WORD_REPLACEMENTS) {
            translated = translated.replace(pattern, replacement);
        }
    }

    return translated;
}

function applyTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
        return;
    }

    const parent = node.parentElement;
    if (!parent || shouldSkipElement(parent)) {
        return;
    }

    const currentValue = node.nodeValue ?? '';

    if (!TEXT_ORIGINALS.has(node)) {
        TEXT_ORIGINALS.set(node, currentValue);
    } else if (currentLocale === 'ru' || hasCyrillic(currentValue)) {
        // React may update content while EN locale is active. If we see Cyrillic again,
        // this is a fresh source string and should become the new original.
        TEXT_ORIGINALS.set(node, currentValue);
    }

    const original = TEXT_ORIGINALS.get(node) ?? '';
    node.nodeValue = currentLocale === 'en' ? translateString(original) : original;
}

function ensureAttrBag(element) {
    if (!ATTR_ORIGINALS.has(element)) {
        ATTR_ORIGINALS.set(element, {});
    }

    return ATTR_ORIGINALS.get(element);
}

function shouldTranslateValueAttribute(element) {
    if (element.tagName !== 'INPUT') {
        return false;
    }

    const type = (element.getAttribute('type') || '').toLowerCase();
    return ['button', 'submit', 'reset'].includes(type);
}

function applyAttribute(element, attribute) {
    if (!element.hasAttribute(attribute)) {
        return;
    }

    if (attribute === 'value' && !shouldTranslateValueAttribute(element)) {
        return;
    }

    const bag = ensureAttrBag(element);
    const currentValue = element.getAttribute(attribute) ?? '';

    if (!(attribute in bag)) {
        bag[attribute] = currentValue;
    } else if (currentLocale === 'ru' || hasCyrillic(currentValue)) {
        bag[attribute] = currentValue;
    }

    const original = bag[attribute] ?? '';
    const nextValue = currentLocale === 'en' ? translateString(original) : original;
    element.setAttribute(attribute, nextValue);
}

function applyElement(element) {
    if (shouldSkipElement(element)) {
        return;
    }

    for (const attr of ATTRS) {
        applyAttribute(element, attr);
    }
}

function walkTree(node) {
    if (!node) {
        return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
        applyTextNode(node);
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    applyElement(node);

    for (const child of node.childNodes) {
        walkTree(child);
    }
}

function applyTitle() {
    if (typeof document === 'undefined') {
        return;
    }

    if (currentLocale === 'en') {
        if (hasCyrillic(document.title)) {
            lastRuTitle = document.title;
        }

        const baseTitle = lastRuTitle || document.title;
        document.title = translateString(baseTitle);
        return;
    }

    if (lastRuTitle) {
        document.title = lastRuTitle;
    }
}

function patchDialogFunctions() {
    if (typeof window === 'undefined') {
        return;
    }

    if (!originalConfirm) {
        originalConfirm = window.confirm.bind(window);
        window.confirm = (message) => {
            const text = String(message ?? '');
            return originalConfirm(currentLocale === 'en' ? translateString(text) : text);
        };
    }

    if (!originalAlert) {
        originalAlert = window.alert.bind(window);
        window.alert = (message) => {
            const text = String(message ?? '');
            originalAlert(currentLocale === 'en' ? translateString(text) : text);
        };
    }

    if (!originalPrompt) {
        originalPrompt = window.prompt.bind(window);
        window.prompt = (message, defaultValue = '') => {
            const text = String(message ?? '');
            return originalPrompt(currentLocale === 'en' ? translateString(text) : text, defaultValue);
        };
    }
}

function applyDocument() {
    if (typeof document === 'undefined' || !document.body) {
        return;
    }

    isApplying = true;
    walkTree(document.body);
    applyTitle();
    document.documentElement.lang = currentLocale;
    isApplying = false;
}

function handleMutations(mutations) {
    if (isApplying) {
        return;
    }

    isApplying = true;

    for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
            applyTextNode(mutation.target);
            continue;
        }

        if (mutation.type === 'attributes') {
            applyElement(mutation.target);
            continue;
        }

        for (const node of mutation.addedNodes) {
            walkTree(node);
        }
    }

    applyTitle();
    isApplying = false;
}

export function initRuntimeTranslator(locale = 'ru') {
    currentLocale = locale === 'en' ? 'en' : 'ru';

    if (typeof document === 'undefined' || !document.body) {
        return;
    }

    patchDialogFunctions();

    if (!observer) {
        observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRS,
        });
    }

    applyDocument();
}

export function setRuntimeLocale(locale = 'ru') {
    currentLocale = locale === 'en' ? 'en' : 'ru';
    applyDocument();
}

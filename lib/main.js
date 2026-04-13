'use strict';

import { Subject, BehaviorSubject } from './util/rx.js';
import { str, randomInt } from './util/common.js';
import csv from './core/csv.js';
import { deflate, inflate } from './util/zip.js';

/** @import { Columns, Rows } from './core/csv.js' */

/** @typedef {typeof ThemeController.Theme[keyof typeof ThemeController.Theme]} Theme */

class ThemeController {
	static DefaultKey = 'color-scheme';
	static Theme = Object.freeze({
		Device: 'device',
		Light: 'light',
		Dark: 'dark',
	});
	/** @type {Theme} */
	static DefaultTheme = ThemeController.Theme.Device;

	#key;
	#toggleModifier;
	#toggleSelector;
	#theme$ = new BehaviorSubject(this.#savedTheme);
	/** @type {Array<() => void>} */
	#unsubscribe = [];

	/**
	@param {Object} params
	@param {string} [params.key]
	@param {string} params.toggleModifier
	@param {(theme: Theme) => string} params.toggleSelector
	*/
	constructor(params) {
		const {
			key = ThemeController.DefaultKey,
			toggleModifier,
			toggleSelector,
		} = params;

		this.#key = key;
		this.#toggleModifier = toggleModifier;
		this.#toggleSelector = toggleSelector;
	}

	init() {
		if (this.#unsubscribe.length) return;

		this.#unsubscribe.push(
			this.theme$.subscribe((theme) => {
				document.documentElement.setAttribute('data-' + this.#key, theme);

				for (const toggleId of Object.values(ThemeController.Theme))
					this.#getToggle(toggleId)?.classList.toggle(this.#toggleModifier, toggleId === theme);

				this.#savedTheme = theme;
			})
		);

		Object.values(ThemeController.Theme).forEach(theme => {
			this.#getToggle(theme)?.addEventListener('click', () => this.theme$.next(theme));
		});
	}

	// TODO: unlisten events
	destroy() {
		this.#unsubscribe.forEach(unsubscribe => unsubscribe());
		this.#unsubscribe = [];
	}

	get theme$() {
		return this.#theme$;
	}

	/** @type {Theme} */
	get #savedTheme() {
		try {
			const value = localStorage.getItem(this.#key);
			if (!value) return ThemeController.DefaultTheme;
			return value;
		} catch {
			return ThemeController.DefaultTheme;
		}
	}

	set #savedTheme(value) {
		try {
			localStorage.setItem(this.#key, value);
		} catch { }
	}

	/**
	@param {Theme} theme
	@returns {HTMLButtonElement?}
	*/
	#getToggle(theme) {
		return document.querySelector(this.#toggleSelector(theme));
	}
}

const themeController = new ThemeController({
	toggleModifier: 'btn_selected',
	toggleSelector: (theme) => `#${ThemeController.DefaultKey}-switcher button#${theme}`,
});
themeController.init();

/** @type {Readonly<Rows>} */
const ROWS = [
	{ fullname: 'Пушкин Александр Сергеевич', mailto: 'pushkin@example.org', tel: '+7(999)999-99-99' },
	{ fullname: 'Владимир Владимирович Путин', mailto: 'putin@kremlin.ru' },
];

/** @type {BehaviorSubject<{ rows: Rows, columns: Columns }>} */
const sheet$ = new BehaviorSubject({
	columns: {
		fullname: { label: 'ФИО' },
		mailto: { label: 'E-Mail' },
		tel: {},
	},
	rows: [{ ...ROWS[randomInt(ROWS.length)] }],
});

/** @type {Subject<string>} */
const hash$ = new Subject();

const URI_SCHEME = Object.freeze({
	/** @see RFC6068 */
	mailto: 'mailto:',
	/** @see RFC3966 */
	tel: 'tel:',
});

/**
@param {Columns} columns
@param {Rows} rows
*/
export const cards = (columns, rows) => str`${rows.map(r => str`<div class="card">
	${Object.keys(columns).filter(c => r[c]).map(c => str`<div class="card__line">
		${URI_SCHEME[c] ? `<a class="card__link" href="${URI_SCHEME[c] + r[c]}">${r[c]}</a>` : r[c]}
		<span class="card__title">${columns[c].label ? columns[c].label : c}</span>
	</div>`)}
</div>`)}`;

sheet$.subscribe(({ columns, rows }) => {
	document.querySelector('.book__list').innerHTML = cards(columns, rows);
});

sheet$.subscribe(async ({ columns, rows }) => {
	try {
		hash$.next(await deflate(csv.serialize(columns, rows)));
	} catch (err) {
		console.error(err);
	}
});

hash$.subscribe(hash => window.location.hash = hash);

/** @param {string} content */
const importSheet = (content) => {
	sheet$.next(csv.deserialize(content));
};

const getState = async () => {
	const sheet = window.location.hash.slice(1);
	if (!sheet) return;
	sheet$.next(csv.deserialize(await inflate(sheet)));
};

getState();

document.addEventListener('dragover', e => { e.preventDefault(); });
document.addEventListener('drop', e => {
	e.preventDefault();
	const file = e.dataTransfer?.files?.item(0);
	if (!file) return;
	const reader = new FileReader();
	reader.onload = progress => importSheet(progress.target.result);
	reader.readAsText(file, 'utf-8');
});

const qrcode = new QRCode(document.querySelector('.qrcode .qrcode__region'), {
	width: 512,
	height: 512,
	colorDark: '#000',
	colorLight: '#fff',
	correctLevel: QRCode.CorrectLevel.M
});

const MAX_QR_CHARS = 2300;

hash$.subscribe((hash) => {
	/** @type {HTMLDivElement?} */
	const msg = document.querySelector('.qrcode .qrcode__msg');
	/** @type {HTMLDivElement?} */
	const region = document.querySelector('.qrcode .qrcode__region');
	const url = `${location.origin}#${hash}`;

	if (url.length > MAX_QR_CHARS) {
		qrcode.clear();
		region.style = 'display: none';
		msg.innerHTML = [
			'<p>',
			'<b>Ссылка не помещается в QR-код</b><br />',
			'Можно поделится ей другими способами или сократить кол-во записей<br />',
			'</p>',
		].join(String());
	} else {
		region.style = String();
		msg.textContent = String();
		qrcode.makeCode(url);
	}
});

window.qrBook = {
	exportFile() {
		const { columns, rows } = sheet$.value;
		const sheet = csv.serialize(columns, rows);
		const blob = new Blob([sheet], { type: 'text/csv;charset=utf-8;' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'qrbook.csv';
		a.click();
		URL.revokeObjectURL(a.href);
	},
	/** @param {Event} e */
	handleFile(e) {
		/** @type {HTMLInputElement?} */
		const fileInput = e.target;
		const file = fileInput?.files?.item(0);
		if (!file) return;
		const reader = new FileReader();
		reader.onload = progress => importSheet(progress.target.result);
		reader.readAsText(file, 'utf-8');
	}
};

'use strict';

import csv from '../util/csv.js';

/**
@typedef {Record<string, { label?: string }>} Columns
@typedef {Record<keyof Columns, string>[]} Rows
*/

export const HEAD_SEPARATOR = ':';

/**
@param {Columns} columns
@param {Rows} rows
@param {boolean} [bom]
*/
export function serialize(columns, rows, comma = csv.SEPARATOR, bom) {
	return csv.serialize(
		Object.keys(columns).map(c => columns[c].label ? `${c}:${columns[c].label}` : c),
		rows.map(r => Object.fromEntries(Object.keys(r).map(c => [
			columns[c].label ? `${c}:${columns[c].label}` : c,
			r[c]
		]))),
		comma,
		bom,
	);
}

/** @param {string} sheet */
export function deserialize(sheet, comma = csv.SEPARATOR) {
	const { rows, columns } = csv.deserialize(sheet, comma);
	return {
		columns: Object.fromEntries(columns.map(c => {
			const [key, label] = c.split(HEAD_SEPARATOR);
			/** @type {Columns[keyof Columns]} */
			const entry = {};
			if (label) entry.label = label;
			return [key, entry];
		})),
		rows: rows.map(r => {
			return Object.fromEntries(Object.keys(r).map(k => {
				const [c] = k.split(HEAD_SEPARATOR);
				return [c, r[k]];
			}))
		})
	};
}

export default {
	serialize,
	deserialize,
};

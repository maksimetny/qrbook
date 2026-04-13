'use strict';

export const SEPARATOR = ';';

/**
@param {string[]} columns
@param {Record<string, string>[]} rows
*/
export function serialize(columns, rows, comma = SEPARATOR, bom = true) {
	const content = [
		columns.join(';'),
		...rows.map(r => columns.map(c => r[c]).join(comma))
	].join('\n') + '\n';

	return bom ? '\uFEFF' + content : content;
}

/** @param {string} sheet */
export function deserialize(sheet, comma = SEPARATOR) {
	const lines = sheet.split('\n')
		.map(line => line.trim())
		.filter(Boolean);
	const [header, ...rows] = lines;
	const columns = header.split(comma);

	return {
		columns,
		rows: rows.map(r => {
			/** @type {Record<string, string>} */
			const entry = {};
			const values = r.split(comma);

			for (let j = 0; j < columns.length; j++) entry[columns[j]] = values[j];

			return entry;
		}),
	};
}

export default {
	serialize,
	deserialize,
};

'use strict';

/** @template T */
export class Observable {
	/** @protected @type {Array<(value: T) => void>} */
	_listeners = [];

	/** @param {(value: T) => void} callback */
	subscribe(callback) {
		this._listeners.push(callback);
		return () => {
			this._listeners = this._listeners.filter(_callback => _callback !== callback);
		};
	}
}

/**
@template T
@extends {Observable<T>}
*/
export class Subject extends Observable {
	/** @param {T} value */
	next(value) {
		[...this._listeners].forEach(callback => callback(value));
	}
}

/**
@template T
@extends {Subject<T>}
*/
export class BehaviorSubject extends Subject {
	/** @protected */
	_value;

	/** @param {T} initialValue */
	constructor(initialValue) {
		super();
		this._value = initialValue;
	}

	get value() {
		return this._value;
	}

	/** @param {(value: T) => void} callback */
	subscribe(callback) {
		callback(this._value);
		return super.subscribe(callback);
	}

	next(value) {
		this._value = value;
		super.next(value);
	}
}

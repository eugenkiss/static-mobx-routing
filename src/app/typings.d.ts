declare var process: any


///<reference path="../../node_modules/@types/es6-shim/index.d.ts"/>
// es6-shim typings somehow miss the following:

interface Symbol {
	toString(): string;
	valueOf(): Object;
}

interface SymbolConstructor {
    prototype: Symbol;
	(description?: string|number): symbol;
	//noinspection ReservedWordAsName
	for(key: string): symbol;
	keyFor(sym: symbol): string;
}

declare var Symbol: SymbolConstructor;

//noinspection JSUnusedGlobalSymbols
interface SymbolConstructor {
	hasInstance: symbol;
	isConcatSpreadable: symbol;
	match: symbol;
	replace: symbol;
	search: symbol;
	species: symbol;
	split: symbol;
	toPrimitive: symbol;
	toStringTag: symbol;
	unscopables: symbol;
}

//noinspection JSUnusedGlobalSymbols
interface Symbol {
    [Symbol.toStringTag]: "Symbol";
}

//noinspection JSUnusedGlobalSymbols
interface SymbolConstructor {
	iterator: symbol;
}

interface Iterator<T> {
    next(value?: any): IteratorResult<T>;
    //noinspection ReservedWordAsName
    return?(value?: any): IteratorResult<T>;
    //noinspection ReservedWordAsName
    throw?(e?: any): IteratorResult<T>;
}

//noinspection JSUnusedGlobalSymbols
interface Iterable<T> {
    [Symbol.iterator](): Iterator<T>;
}

//noinspection JSUnusedGlobalSymbols
interface IterableIterator<T> extends Iterator<T> {
    [Symbol.iterator](): IterableIterator<T>;
}

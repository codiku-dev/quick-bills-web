export type WithoutFunctions<T> = {
    [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

export type NonNullableValues<T> = {
    [K in keyof T]: NonNullable<T[K]>;
};

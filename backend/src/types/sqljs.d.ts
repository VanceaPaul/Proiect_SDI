declare module 'sql.js' {
  export interface SqlJsInitObject {
    locateFile?: (file: string) => string;
  }

  export interface Statement {
    bind(values?: ArrayLike<unknown>): void;
    run(values?: ArrayLike<unknown>): Statement;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  export interface Database {
    run(sql: string): Database;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: {
      new (data?: Uint8Array): Database;
    };
  }

  export default function initSqlJs(config?: SqlJsInitObject): Promise<SqlJsStatic>;
}

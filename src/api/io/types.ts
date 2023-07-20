import type { ServiceSchema } from 'moleculer';
import type { IOServiceSchema } from 'moleculer-io';
import type { ApiSettingsSchema } from 'moleculer-web';
import type { Server } from 'socket.io';

type SocketMiddleware = Parameters<Server['use']>[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IOEventCallbackList = { name?: string; params: any }[];

type IOServiceMethods = IOServiceSchema['methods'] & {
  SocketAutoTimeoutMiddleware: SocketMiddleware;
};

export type IOEventCallback = (nullInput: null, callback: IOEventCallbackList) => void;

export type GHGatewayServiceSchema = ServiceSchema<ApiSettingsSchema> &
  IOServiceSchema & {
    methods: IOServiceMethods;
  };

// TODO: move to hh-util
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

import AbstractNormalizer from './AbstractNormalizer.js';

// ! FIXME: See how the data format here works... When converting to typescript, we're not sure
// exactly how this will work compared to other normalizers...
// Essentially, it's weird to see ...args[0] spread just the first parameter, but that might
// be exactly what it should do, and we should look into what that actually is
// My initial guess is the value will always be the CHANNEL the event comes from via
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SeeEventsForMoreInfo = import('tmi.js').Events;

export default class ProxyNormalizer extends AbstractNormalizer {
  // Technically we want to use this as a blind proxy, so ANY type of data could come through
  // Instead of attempting to type it, we'll just accept and pass through as our proxy is meant to
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override normalize = (...args: any[]) => {
    return {
      timestamp: Date.now(),
      ...args[0]
    };
  };
}

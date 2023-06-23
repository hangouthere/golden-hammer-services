export default {
  events: {
    '$node.disconnected'(ctx) {
      const {
        node: { local }
      } = ctx.params;

      if (true === local) {
        debugger;

        console.log('!!!!!!!! Node Disconnected !!!!!!!!', ctx.params, ctx.meta);
        process.exit(99);
      }
    }
  }
};

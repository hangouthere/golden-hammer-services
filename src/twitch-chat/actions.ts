const Actions = {
  actions: {
    joinChannel: {
      params: {
        connectTarget: 'string'
      }
    },
    partChannel: {
      params: {
        connectTarget: 'string'
      }
    },
    register: {
      params: {
        connectTarget: 'string',
        eventClassifications: 'string[]'
      }
    },
    unregister: {
      params: {
        connectTarget: 'string',
        eventClassifications: 'string[]'
      }
    }
  }
};

export default Actions;

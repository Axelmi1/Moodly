module.exports = {
    async beforeCreate(event) {
      const { params } = event
      const user = event.state?.user || event.context?.state?.user
      if (user) {
        params.data.user = user.id
      }
    },
  }
  
const delay = (t: number): Promise<Boolean> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, t)
  })

export default delay

import puppeteer from 'puppeteer-core'

export default async (
  browser: puppeteer.Browser,
  mailbox: string
): Promise<string | null> => {
  const page = await browser.newPage()
  await page.goto(`https://mailnesia.com/mailbox/${mailbox}`, {
    waitUntil: 'networkidle0'
  })

  const emails = await page.$$('tbody tr:nth-of-type(1)')

  let verifCode = null
  for (const email of emails) {
    const dateHandle = await email.$('td:nth-of-type(1)')
    const subjectHandle = await email.$('td:nth-of-type(4)')

    const date: string = await dateHandle?.evaluate((node) => node.innerText)
    const subject: string = await subjectHandle?.evaluate(
      (node) => node.innerText
    )

    if (
      date?.trim()?.search(/second|minute/i) >= 0 &&
      subject?.trim()?.search(/^microsoft.*code$/i) >= 0
    ) {
      const emailId = await email.evaluate((node) => node?.id)
      await page.click(`tr[id="${emailId}"]`, { delay: 50 })
      await page.bringToFront()
      let emailBody = await page.waitForSelector('div.pill-content', {
        visible: true
      })
      if (!emailBody) {
        await page.click(`tr[id="${emailId}"]`, { delay: 50 })
        await page.bringToFront()
        emailBody = await page.waitForSelector('div.pill-content', {
          visible: true
        })
        if (!emailBody) continue
      }
      const codeHandler = await emailBody.$('tbody tr:nth-of-type(4) span')
      if (codeHandler) {
        verifCode = await codeHandler?.evaluate((node) => node.innerText)
        break
      }
    }
  }
  // page.close()
  return verifCode
}

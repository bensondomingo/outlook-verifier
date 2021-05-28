import puppeteer from 'puppeteer'

import selectors from '../selectors/mailnesia'

export default async (
  browser: puppeteer.Browser,
  mailbox: string
): Promise<string | null> => {
  const page = await browser.newPage()
  await page.goto(`https://mailnesia.com/mailbox/${mailbox}`, {
    waitUntil: 'networkidle0'
  })

  const emails = await page.$$(selectors.email_list)

  let verifCode = null
  for (const email of emails) {
    const dateHandle = await email.$(selectors.email_date)
    const subjectHandle = await email.$(selectors.email_subject)

    const date: string = await dateHandle?.evaluate((node) => node.innerText)
    const subject: string = await subjectHandle?.evaluate(
      (node) => node.innerText
    )

    if (
      date?.trim()?.search(/second|minute/i) >= 0 &&
      subject?.trim()?.search(/^microsoft.*code$/i) >= 0
    ) {
      const emailId = await email.evaluate((node) => node?.id)
      await page.click(selectors.email_target(emailId), { delay: 50 })
      await page.bringToFront()
      const emailBody = await page.waitForSelector(selectors.email_body, {
        visible: true
      })
      if (!emailBody) continue
      const codeHandler = await emailBody.$(selectors.verif_code)
      if (codeHandler) {
        verifCode = await codeHandler?.evaluate((node) => node.innerText)
        break
      }
    }
  }
  page.close()
  return verifCode
}

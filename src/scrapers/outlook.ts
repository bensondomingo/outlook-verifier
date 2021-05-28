import puppeteer from 'puppeteer'

import delay from '../utils/delay'
import mailnesiaScraper from '../scrapers/mailnesia'
import selector from '../selectors/outlook'

interface OutlookCredentials {
  email: string
  emailPassword: string
  recoveryEmail: string
}

const getNameFromEmail = (email: string): string => email.split('@')[0]

export default async (credentials: OutlookCredentials): Promise<boolean> => {
  /*
    Use new browser instance every login attempt to make sure previous
    previous logged in account won't interfere.
  */
  const browser = await puppeteer.launch({ headless: false })

  const page = await browser.newPage()
  await page.goto('https://login.live.com/', { waitUntil: 'networkidle0' })

  // enter email then click submit button
  await page.type(selector.input__email, credentials.email, { delay: 100 })
  await delay(200)
  await page.click(selector.input_submit, { delay: 100 })

  // wait for the password input to be visible
  await page.waitForSelector(selector.input__password, { visible: true })
  await delay(1000)
  // enter password then click submit button
  await page.type(selector.input__password, credentials.emailPassword, {
    delay: 100
  })
  await delay(200)
  await page.click(selector.input_submit, { delay: 50 })

  // wait for identity verification form
  await page.waitForSelector(selector.radio__alternate_email, {
    visible: true
  })
  await page.click(selector.radio__alternate_email, { delay: 50 })
  await page.waitForSelector(selector.input__email, { visible: true })

  await delay(1000)
  await page.type(
    selector.input__email,
    getNameFromEmail(credentials.recoveryEmail),
    { delay: 50 }
  )
  await page.click(selector.input__submit_alternate_email, { delay: 50 })

  // Get verification code
  let verifCode = null
  for (let retryCount = 0; retryCount < 5; retryCount++) {
    await delay(1000 * 10) // 10 seconds delay
    verifCode = await mailnesiaScraper(
      browser,
      getNameFromEmail(credentials.recoveryEmail)
    )
    if (verifCode) break
  }

  if (!verifCode) {
    console.log('Failed to retrive verification code')
    await browser.close()
    return false
  }

  await page.bringToFront()
  console.log(verifCode)

  await page.type(selector.input__verif_code, verifCode, { delay: 5 })
  await page.click(selector.input_submit, { delay: 50 })
  await delay(5000)
  await page.click(selector.input_submit, { delay: 50 })

  await browser.close()

  return true
}

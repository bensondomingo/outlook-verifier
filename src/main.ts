import puppeteer from 'puppeteer'

import mailnesiaScraper from './scrapers/mailnesia'
import outlookSelector from './selectors/outlook'
import delay from './utils/delay'

const linkedinAccount = {
  email: 'claudemelendrez@outlook.com',
  password: 'KSXFMwmQ6hdLW',
  emailPassword: 'cFQK4ZydR',
  recoveryEmail: 'claudemelendrez@mailnesia.com'
}

const getNameFromEmail = (email: string): string => email.split('@')[0]

const main = async () => {
  const browser = await puppeteer.launch({ headless: false })

  const page = await browser.newPage()
  await page.goto('https://login.live.com/', { waitUntil: 'networkidle0' })

  // enter email then click submit button
  await page.type(outlookSelector.input__email, linkedinAccount.email, {
    delay: 100
  })
  await delay(200)
  await page.click(outlookSelector.input_submit, { delay: 100 })

  // wait for the password input to be visible
  await page.waitForSelector(outlookSelector.input__password, { visible: true })
  await delay(1000)
  // enter password then click submit button
  await page.type(
    outlookSelector.input__password,
    linkedinAccount.emailPassword,
    { delay: 100 }
  )
  await delay(200)
  await page.click(outlookSelector.input_submit, { delay: 50 })
  await delay(5000)
  // wait for identity verification form
  await page.waitForSelector(outlookSelector.radio__alternate_email, {
    visible: true
  })
  await page.click(outlookSelector.radio__alternate_email, { delay: 50 })
  await page.waitForSelector(outlookSelector.input__email, {
    visible: true
  })
  await delay(1000)
  await page.type(
    outlookSelector.input__email,
    getNameFromEmail(linkedinAccount.recoveryEmail),
    { delay: 50 }
  )
  await page.click(outlookSelector.input__submit_alternate_email, { delay: 50 })

  // Try to get verification code 5 times
  let verifCode = null
  for (let retryCount = 0; retryCount < 5; retryCount++) {
    await delay(1000 * 10) // 10 seconds delay
    verifCode = await mailnesiaScraper(
      browser,
      getNameFromEmail(linkedinAccount.recoveryEmail)
    )
    if (verifCode) break
  }

  if (!verifCode) {
    console.log('Failed to retrive verification code')
    await browser.close()
    return
  }

  await page.bringToFront()
  console.log(verifCode)

  await page.type(outlookSelector.input__verif_code, verifCode, { delay: 5 })
  await page.click(outlookSelector.input_submit, { delay: 50 })
  await delay(5000)
  await page.click(outlookSelector.input_submit, { delay: 50 })

  await browser.close()
}

main()

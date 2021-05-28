const emailIdSelector = (emailId: string) => {
  return `tr[id="${emailId}"]`
}

export default {
  email_list: 'tbody tr:nth-of-type(1)',
  email_date: 'td:nth-of-type(1)',
  email_subject: 'td:nth-of-type(4)',
  email_body: 'div.pill-content',
  email_target: emailIdSelector,
  verif_code: 'tbody tr:nth-of-type(4) span'
}

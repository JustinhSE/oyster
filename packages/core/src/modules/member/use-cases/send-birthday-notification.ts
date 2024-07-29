import { sql } from 'kysely';

import { type GetBullJobData } from '@/infrastructure/bull/bull.types';
import { job } from '@/infrastructure/bull/use-cases/job';
import { db } from '@/infrastructure/database';
import { ENV } from '@/shared/env';

export async function sendBirthdayNotification(
  _: GetBullJobData<'student.birthdate.daily'>
) {
  const members = await db
    .selectFrom('students')
    .select(['firstName', 'lastName', 'slackId'])
    .whereRef(
      sql`EXTRACT(MONTH FROM birthdate)`,
      '=',
      sql`EXTRACT(MONTH FROM CURRENT_DATE)`
    )
    .whereRef(
      sql`EXTRACT(DAY FROM birthdate)`,
      '=',
      sql`EXTRACT(DAY FROM CURRENT_DATE)`
    )
    .where('birthdateNotification', 'is', true)
    .execute();

  if (members.length == 1){
    job('notification.slack.send', {
        channel: ENV.SLACK_BIRTHDAYS_CHANNEL_ID,
        message: `Everyone wish a happy birthday to <@${members[0].slackId}>! 🎉🎂🎈`,
        workspace: 'regular',
      });
  }
  if(members.length == 2){
      job('notification.slack.send', {
        channel: ENV.SLACK_BIRTHDAYS_CHANNEL_ID,
        message: `Everyone wish a happy birthday to <@${members[0].slackId}> and <@${members[1].slackId}>! 🎉🎂🎈`,
        workspace: 'regular',
      });
  }
  else{
    let count = 0;
    const msg = "";
    while(count < members.length-2){
      msg = msg.concat(<@${members[count].slackId}> + ',');
      count++; 
    }
    msg = msg.concat("and" + <@${members[members.length-1].slackId}>);
    job('notification.slack.send', {
        channel: ENV.SLACK_BIRTHDAYS_CHANNEL_ID,
        message: `Everyone wish a happy birthday to <@${members[0].slackId}> and <@${members[1].slackId}>! 🎉🎂🎈`,
        workspace: 'regular',
      });
  }
}

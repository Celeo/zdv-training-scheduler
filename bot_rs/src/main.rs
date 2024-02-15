use anyhow::Result;
use dotenv::dotenv;
use log::{error, info, warn};
use std::{env, sync::Arc};
use tokio_cron_scheduler::{Job, JobScheduler};
use twilight_http::Client;

const SITE_URL_ENV_VAR: &str = "SITE_URL";
const SITE_TOKEN_ENV_VAR: &str = "SITE_TOKEN";
const BOT_TOKEN_ENV_VAR: &str = "DISCORD_BOT_TOKEN";

async fn check_messages(client: &Arc<Client>) -> Result<()> {
    info!("check_messages");
    Ok(())
}

async fn check_reminders(client: &Arc<Client>) -> Result<()> {
    info!("check_reminders");
    Ok(())
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info");
    }
    pretty_env_logger::init();

    let token = env::var(BOT_TOKEN_ENV_VAR).expect("Missing bot token env var");
    let http = Arc::new(Client::new(token));

    let scheduler = JobScheduler::new()
        .await
        .expect("Could not start scheduler");

    let c = Arc::clone(&http);
    _ = scheduler
        .add(
            Job::new_async("0 * * * * * *", move |uuid, mut l| {
                let c = c.clone();
                Box::pin(async move {
                    if l.next_tick_for_job(uuid).await.is_ok() {
                        if let Err(e) = check_messages(&c).await {
                            error!("Error running check_messages: {e}");
                        }
                    } else {
                        warn!("Job tick failed");
                    }
                })
            })
            .unwrap(),
        )
        .await
        .unwrap();

    let c = Arc::clone(&http);
    _ = scheduler
        .add(
            Job::new_async("0 0 * * * * *", move |uuid, mut l| {
                let c = c.clone();
                Box::pin(async move {
                    if l.next_tick_for_job(uuid).await.is_ok() {
                        if let Err(e) = check_reminders(&c).await {
                            error!("Error running check_reminders: {e}");
                        }
                    } else {
                        warn!("Job tick failed");
                    }
                })
            })
            .unwrap(),
        )
        .await
        .unwrap();
}

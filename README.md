
![Logo](https://i.ibb.co/8PmGQ5J/daoify-logo.png)


## DAOify Raffles

Solana raffle system with support for custom SPL Tokens

(This is still a work in progress, and some broken features, and others that are yet to be completed)

**There is currenly no escrow system in place as this system was designed for whitelist giveaways in trusted communities**

## 
 
 - [Official Deployments](https://github.com/dynaris/solana-raffles#official-deployments)
 - [Deploy Your Own Version](https://github.com/dynaris/solana-raffles#deploy-your-own-version)
 - [Docs](https://github.com/dynaris/solana-raffles)


## Deploy your own version


Deploying the program

- `git clone` the project from this repository
- Update the keypair path in `Anchor.toml`
- `anchor build`
- `anchor deploy`
- add the new program ID in `Anchor.toml` and `lib.rs`
- `anchor build` (remember do to this)
- `anchor deploy`

Starting the UI

- Copy the new idl from `target/idl/**` and types from `target/types/**`
- `cd app`
- `yarn` 
- You will need to add an ImageBB api key in your `.env` under `REACT_APP_IMAGE_BB`
- `yarn dev`


## Official Deployments

### Front End

https://raffles.dynaris.xyz

### Contract

Mainnet

```
51cc35jbkQ8oaJXiYmKaeWEaiucmSunoTRMjAGUyaTGC
```

Devnet

```
4ZEPy6oo8oHzbU6bkiY2m8pLb7aNzyzZaMpAZ6CeZQQf
```



## Authors

- [@dynaris](https://www.github.com/dynaris)
- [@internetbands](https://www.github.com/internetbandz)


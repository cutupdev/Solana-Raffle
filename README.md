

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

import { useEffect, useState, useCallback } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import kp from './keypair.json'
// import BN from 'bn.js';


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, 
  // Keypair 
} = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);


// Set our network to devent.
const network = clusterApiUrl("devnet");

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed",
};

// Change this up to be your Twitter if you like.
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const [walletAddress, setWalletAddress] = useState(null);
  //   const TEST_GIFS = [
  //   "https://media.giphy.com/media/v6pq4tpc17rwJ5YtJu/giphy.gif",
  //   "https://media.giphy.com/media/Lg1FRCgJFwb7RfGuJX/giphy.gif",
  //   "https://media.giphy.com/media/zHoydr6ZjJC0zKKhl9/giphy.gif",
  //   "https://media.giphy.com/media/A3556xyE9eMyE7ETv2/giphy.gif",
  // ];

  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");

          /*
           * The solana object gives us a function that will allow us to connect
           * directly with the user's wallet!
           */
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );
          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };
  
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  // const sendGif = async () => {
  //   if (inputValue.length > 0) {
  //     console.log("Gif link:", inputValue);
  //   } else {
  //     console.log("Empty input. Try again.");
  //   }
  // };

  // const upvoteGif = async (index) => {
  //   console.log('Upvote: ', index);
  //   try {
  //     const provider = getProvider();
  //     const program = new Program(idl, programID, provider);

  //     await program.rpc.upvoteGif(new BN(index.toString()), {
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //       },
  //     });
  //     console.log('Gif upvoted', index);

  //     await getGifList();
  //   } catch (error) {
  //     console.log('Error upvoting GIF:', error);
  //   }
  // };
  
  // const downvoteGif = async (index) => {
  //   try {
  //     const provider = getProvider();
  //     const program = new Program(idl, programID, provider);

  //     await program.rpc.downvoteGif(new BN(index.toString()), {
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //       },
  //     });
  //     console.log('Gif downvoted', index);

  //     await getGifList();
  //   } catch (error) {
  //     console.log('Error downvoting GIF:', error);
  //   }
  // };
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt={item.gifLink} />
                <div className='gif-item-info'>
                  <div style={{color: "white"}}>Submitted by: {item.userAddress.toString()}</div>
                  {/* <div>Upvotes: {item.upvotes.toString()}</div>
                  <div>Downvotes: {item.downvotes.toString()}</div> */}
                </div>
                {/* <div className='button-group'>
                  <button
                    className={`cta-button upvote-gif-button ${
                      item.upvoters.some((it) => it.toString() === walletAddress) &&
                      'upvote-gif-button-active'
                    }`}
                    onClick={() => upvoteGif(index)}
                  >
                    Upvote
                  </button>
                  <button
                    className={`cta-button downvote-gif-button ${
                      item.downvoters.some((it) => it.toString() === walletAddress) &&
                      'downvote-gif-button-active'
                    }`}
                    onClick={() => downvoteGif(index)}
                  >
                    Downvote
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener("load", async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = useCallback(async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifs: ", error);
      setGifList(null);
    }
  });

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress]);

  // const getGifList = useCallback(async () => {
  //   try {
  //     const provider = getProvider();
  //     const program = new Program(idl, programID, provider);
  //     const account = await program.account.baseAccount.fetchNullable(
  //       baseAccount.publicKey
  //     );

  //     if (!account) {
  //       return;
  //     }

  //     console.log("Got the account", account);
  //     setGifList(account.gifList);
  //   } catch (error) {
  //     console.log("Error in getGifs: ", error);
  //     setGifList([]);
  //   }
  // }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress, getGifList]);

  // useEffect(() => {
  //   if (walletAddress) {
  //     console.log("Fetching GIF list...");

  //     // Call Solana program here.

  //     // Set state
  //     setGifList(TEST_GIFS);
  //   }
  // }, [walletAddress]);

  return (
    <div className="App">
      {/*<div className={walletAddress ? 'authed-container' :'container'}></div>*/}
      <div className="container">
        <div className="header-container">
          <p className="header">🌈Meme Hub</p>
          <p className="sub-text">
            View your Meme collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { useToasts } from 'react-toast-notifications';

// routing
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

// Helpers
import { connectWallet, NETWORK } from '../poap-eth';
import { getTokenInfoWithENS, postTokenMigration, TokenInfo } from '../api';

// constants
import { LAYERS } from '../lib/constants';

// assets
import EmptyBadge from '../images/empty-badge.svg';

// utils
import { useBodyClassName } from '../react-helpers';
import { SubmitButton } from '../components/SubmitButton';
import abi from '../abis/PoapDelegatedMint.json';
import { TransactionReceipt } from 'web3-core';
import { TxDetail } from '../components/TxDetail';
import { useWindowWidth } from '@react-hook/window-size';
import { reduceAddress } from '../lib/helpers';

const CONTRACT_ADDRESS = process.env.REACT_APP_MINT_DELEGATE_CONTRACT;

export const TokenDetailPage: React.FC<RouteComponentProps<{
  tokenId: string;
}>> = ({ match }) => {
  const [token, setToken] = useState<null | TokenInfo>(null);
  const [web3, setWeb3] = useState<any>(null);
  const [migrateInProcess, setMigrateInProcess] = useState<boolean>(false);
  const [migrationFinished, setMigrationFinished] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [txReceipt, setTxReceipt] = useState<null | TransactionReceipt>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { addToast } = useToasts();

  const width = useWindowWidth();

  const submitMigration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setMigrateInProcess(true);
    try {
      const result = await postTokenMigration(parseInt(token.tokenId));
      if (result) {
        await migrateToken(result.signature);
      }
    } catch {
      showErrorMessage();
    }

    setMigrateInProcess(false);
  };

  const migrateToken = async (signature: string) => {
    let _web3 = web3;
    if (!_web3) {
      let response = await connectWallet();
      if (!response.web3) return null;
      _web3 = response.web3;
      if (response.networkError) {
        let message = `Wrong network, please connect to ${NETWORK}.`;
        addToast(message, {
          appearance: 'error',
          autoDismiss: false,
        });
        return null;
      }

      setWeb3(_web3);
    }

    const accounts = await _web3.eth.getAccounts();
    if (accounts.length === 0) return null;

    const account = accounts[0];
    if (!token) return;

    try {
      const contract = new _web3.eth.Contract(abi, CONTRACT_ADDRESS);
      let gas = 1000000;
      try {
        gas = await contract.methods
          .mintToken(token.event.id, token.tokenId, token.owner, signature)
          .estimateGas({ from: account });
        gas = Math.floor(gas * 1.3);
      } catch (e) {
        console.log('Error calculating gas');
      }

      contract.methods
        .mintToken(token.event.id, token.tokenId, token.owner, signature)
        .send({ from: account, gas: gas }, (err: any, hash: string | null) => {
          if (err) {
            console.log('Error on Mint Token: ', err);
            showErrorMessage();
          }
          if (hash) {
            setTxHash(hash);
          }
        });
    } catch (e) {
      console.log('Error submitting transaction');
      console.log(e);
      showErrorMessage();
    }
  };

  const showErrorMessage = () => {
    setMigrateInProcess(false);
    let message = `Error while trying to submit transaction.\nPlease try again.`;
    addToast(message, {
      appearance: 'error',
      autoDismiss: false,
    });
  };

  const getReceipt = async () => {
    let receipt: null | TransactionReceipt = null;
    if (web3 && txHash !== '' && !txReceipt) {
      receipt = await web3.eth.getTransactionReceipt(txHash);
      if (receipt) {
        setTxReceipt(receipt);
      }
    }

    if (!receipt || !receipt.status || (txReceipt && !txReceipt.status)) {
      setMigrateInProcess(false);
    }

    if (receipt && receipt.status) setMigrationFinished(true);
  };

  useBodyClassName('poap-app event-page');

  useEffect(() => {
    try {
      fetchToken().then();
    } catch (e) {
      console.log(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  useEffect(() => {
    if (txHash && web3) {
      const interval = setInterval(() => {
        getReceipt().then();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [txHash, txReceipt]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const fetchToken = async () => {
    setLoading(true);
    const token = await getTokenInfoWithENS(match.params.tokenId);
    setToken(token);
    setLoading(false);
  };

  return (
    <>
      <div className="header-events token-page">
        <div className="container">
          <div className="logo-event token-page">
            {loading && <img src={EmptyBadge} alt="loading" />}
            {!loading && <img src={token?.event.image_url} alt="" />}
          </div>
          <h1>{loading ? 'Loading...' : token?.event.name}</h1>
          {!loading && (
            <div className="date-city-container">
              <div className="date">{token?.event.start_date}</div>
              {(token?.event.city || token?.event.country) && (
                <div>
                  {token?.event.city ? `${token?.event.city}, ` : ''}
                  {token?.event.country}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {!loading && (
        <main id="site-main" role="main" className="main-events">
          <div className="main-content">
            <div className="container claim-info">
              <div className="content-event">
                <h2>Collection</h2>
                <div className={`wallet-number ${token?.ens && token?.ens.valid ? 'ens' : ''}`}>
                  <Link to={`/scan/${token?.ens && token.ens.valid ? token.ens : token?.owner}`}>
                    {token?.ens && token.ens.valid
                      ? token?.ens
                      : width < 500
                      ? reduceAddress(token?.owner || '')
                      : token?.owner}
                  </Link>
                </div>
                <h2>Brog on the interwebz</h2>
                <div className="communities-container">
                  <a href="https://twitter.com/poapxyz/" target="_blank" rel="noopener noreferrer" className="twitter">
                    twitter
                  </a>
                  <a href="https://t.me/poapxyz" target="_blank" rel="noopener noreferrer" className="telegram">
                    telegram
                  </a>
                  <a href="https://reddit.com/r/poap" target="_blank" rel="noopener noreferrer" className="reddit">
                    reddit
                  </a>
                </div>
              </div>
              <div className={'migration-section'}>
                {token?.layer === LAYERS.layer2 && !migrationFinished && !txHash && (
                  <>
                    <div className={'divider'} />
                    <p>This POAP is currently on xDAI and it can be migrated to mainnet</p>
                    <div>
                      <form onSubmit={submitMigration}>
                        <SubmitButton text={'Migrate POAP'} isSubmitting={migrateInProcess} canSubmit={true} />
                      </form>
                    </div>
                  </>
                )}
                {token?.layer === LAYERS.layer2 && migrationFinished && (
                  <p className={'success'}>POAP migrated successfully!</p>
                )}
                {txHash && <TxDetail hash={txHash} receipt={txReceipt} />}
                {txReceipt && !txReceipt.status && (
                  <>
                    <div className={'divider'} />
                    <div className={'text-info'} data-aos="fade-up">
                      <p>It seems that your transaction failed. Please refresh the page</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
};

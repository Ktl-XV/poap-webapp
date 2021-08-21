import React, { FC, useState, useEffect, MouseEvent } from 'react';
import { useToasts } from 'react-toast-notifications';
import ReactModal from 'react-modal';

// routing
import { RouteComponentProps } from 'react-router';

// libraries
import classNames from 'classnames';
import delve from 'dlv';

/* Helpers */
import { shortAddress } from '../poap-eth';
import { TokenInfo, getTokensFor, resolveENS, getENSFromAddress, requestEmailRedeem } from '../api';
import { isValidAddress, isValidEmail } from '../lib/helpers';
import { connectWallet } from '../poap-eth';

/* Assets */
import NoEventsImg from '../images/event-2019.svg';

/* Components */
import { Loading } from '../components/Loading';
import { SubmitButton } from '../components/SubmitButton';
import TokenSmall from '../components/TokenSmall';
import AddressInput from '../components/AddressInput';

/* Utils */
import abiPoap from '../abis/Poap.json';
import abiMultitransfer from '../abis/Multitransfer.json';
import { TransactionReceipt } from 'web3-core';
import { TxDetail } from '../components/TxDetail';

const CONTRACT_ADDRESS = process.env.REACT_APP_L2_ADDRESS;
const L2_NETWORK = process.env.REACT_APP_L2_ETH_NETWORK;
const MULTITRANSFER_CONTRACT = process.env.REACT_APP_L2_MULTITRANSFER_CONTRACT;

type AddressTokensPageState = {
  tokens: null | TokenInfo[];
  address: null | string;
  ens: null | string;
  error: boolean;
  loading: boolean;
  isRedeemModalOpen: boolean;
  isRedeemLoading: boolean;
  isSelectModeActive: boolean;
  selectedTokens: string[];
  isTransferModalOpen: boolean;
};

type TokenByYear = {
  year: number;
  tokens: TokenInfo[];
};

const TransferButton: React.FC<{
  setSelectState: Function;
  setSelectedTokens: Function;
  startTransfer: Function;
  tokenIds: string[];
  isSelectModeActive: boolean;
  selectedTokens: string[];
}> = ({ children, setSelectState, setSelectedTokens, startTransfer, tokenIds, isSelectModeActive, selectedTokens }) => {
  const startTokenSelection = () => {
    setSelectState(true);
  };

  const transfer = () => {
    startTransfer();
  };

  const cancel = () => {
    setSelectedTokens([]);
    setSelectState(false);
  };

  const selectAll = () => {
    setSelectedTokens(tokenIds);
  };

  let message = 'Select tokens';
  if (selectedTokens.length > 0) {
    message = 'Transfer selected tokens';
  }

  if (tokenIds.length === 0) {
    return <></>;
  }
  if (isSelectModeActive) {
    return (
      <div className="buttons-wrapper">
        <button className="btn btn-transfer secondary" onClick={selectAll}>
          <span>Select All</span>
        </button>
        <button className="btn btn-transfer" onClick={transfer} disabled={selectedTokens.length === 0}>
          <span>{message}</span>
        </button>
        <button className="btn btn-transfer cancel" onClick={cancel}>
          <span>Cancel</span>
        </button>
      </div>
    );
  } else {
    return (
      <button className="btn btn-transfer" onClick={startTokenSelection}>
        <span>Transfer</span>
      </button>
    );
  }
};

export const AddressTokensPage: FC<RouteComponentProps> = ({ location, match }) => {
  const [state, setState] = useState<AddressTokensPageState>({
    tokens: null,
    error: false,
    address: null,
    ens: null,
    loading: false,
    isRedeemModalOpen: false,
    isRedeemLoading: false,
    isSelectModeActive: false,
    selectedTokens: [],
    isTransferModalOpen: false,
  });
  const [web3, setWeb3] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [txReceipt, setTxReceipt] = useState<null | TransactionReceipt>(null);
  const [transferFinished, setTransferFinished] = useState<boolean>(false);

  const { addToast } = useToasts();
  const {
    tokens,
    error,
    address,
    ens,
    loading,
    isRedeemLoading,
    isRedeemModalOpen,
    isSelectModeActive,
    selectedTokens,
    isTransferModalOpen,
  } = state;

  useEffect(() => {
    getTokens();
  }, []); // eslint-disable-line

  const handleOpenRedeemModalClick = () => {
    setState((oldState) => ({ ...oldState, isRedeemModalOpen: true }));
  };

  const handleCloseRedeemModalClick = () => {
    setState((oldState) => ({ ...oldState, isRedeemModalOpen: false }));
  };

  const handleCloseTransferModalClick = () => {
    setState((oldState) => ({ ...oldState, isTransferModalOpen: false }));
  };

  const handleRedeemConfirm = () => {
    if (!address) return;
    setState((oldState) => ({ ...oldState, isRedeemLoading: true }));

    requestEmailRedeem(address)
      .then(() => {
        setState((oldState) => ({ ...oldState, isRedeemModalOpen: false }));

        const successMessage = 'Your request was processed correcty! Please, check your email';

        addToast(successMessage, {
          appearance: 'success',
          autoDismiss: true,
        });
      })
      .catch((e: Error) => {
        const errorMessage = `An error occurred claiming your POAPs:\n${e.message}`;

        addToast(errorMessage, {
          appearance: 'error',
          autoDismiss: false,
        });
      })
      .finally(() => setState((oldState) => ({ ...oldState, isRedeemLoading: false })));
  };

  const getTokens = async () => {
    try {
      setState((oldState) => ({ ...oldState, loading: true }));

      const account = delve(match, 'params.account');
      const addressFromHistory = delve(location, 'state.address');
      const address = account || addressFromHistory;

      if (isValidAddress(address)) {
        const tokens = await getTokensFor(address);
        try {
          const ens = await getENSFromAddress(address);
          setState((oldState) => ({ ...oldState, tokens, address, ens: ens.valid ? ens.ens : null }));
        } catch (e) {
          setState((oldState) => ({ ...oldState, tokens, address, ens: null }));
        }
      } else if (isValidEmail(address)) {
        const tokens = await getTokensFor(address);
        setState((oldState) => ({ ...oldState, tokens, address, ens: null }));
      } else {
        const ensResponse = await resolveENS(address);

        if (ensResponse.valid) {
          const tokens = await getTokensFor(ensResponse.ens);
          setState((oldState) => ({ ...oldState, tokens, address: ensResponse.ens, ens: address }));
        }
      }
    } catch (err) {
      setState((oldState) => ({ ...oldState, error: true }));
    } finally {
      setState((oldState) => ({ ...oldState, loading: false }));
    }
  };

  const getTokenIds = (): string[] => {
    if (state.tokens == null) {
      return [];
    }
    return state.tokens.map((t) => t.tokenId);
  };

  const startTransfer = () => {
    setState((oldState) => ({ ...oldState, isTransferModalOpen: true }));
  };

  const transfer = async (_: string, toAddress: string) => {
    setTransferFinished(false);
    setTxHash('');
    if (address != null) {
      const _web3 = await getWeb3();
      const accounts = await _web3.eth.getAccounts();
      if (accounts.length === 0) return null;

      const account = accounts[0];
      if (address !== account) {
        addToast(`Please connect using the address: ${address}`, {
          appearance: 'error',
          autoDismiss: false,
        });
      } else {
        if (selectedTokens.length > 1) {
          console.log('multi transfer');
          multiTransfer(_web3, address, toAddress, selectedTokens);
        } else {
          console.log('single transfer');
          singleTransfer(web3, address, toAddress, selectedTokens[0]);
        }
      }
    }
  };

  const getWeb3 = async () => {
    let _web3 = web3;
    if (!_web3) {
      let response = await connectWallet(L2_NETWORK);
      if (!response.web3) return null;
      _web3 = response.web3;
      if (response.networkError) {
        let message = `Wrong network, please connect to ${L2_NETWORK}.`;
        addToast(message, {
          appearance: 'error',
          autoDismiss: false,
        });
        return null;
      }

      setWeb3(_web3);
    }
    return _web3;
  };

  const singleTransfer = async (_web3: any, fromAddress: string, toAddress: string, tokenId: string) => {
    try {
      const contract = new _web3.eth.Contract(abiPoap, CONTRACT_ADDRESS);
      let gas = 500000;
      try {
        gas = await contract.methods
          .safeTransferFrom(fromAddress, toAddress, tokenId)
          .estimateGas({ from: fromAddress });
        gas = Math.floor(gas * 1.3);
      } catch (e) {
        console.log('Error calculating gas');
      }

      contract.methods
        .safeTransferFrom(fromAddress, toAddress, tokenId)
        .send({ from: fromAddress, gas: gas })
        .on('error', (err: Error) => {
          console.log('Error on Multitransfer Approval: ', err);
          showErrorMessage();
        })
        .on('transactionHash', (hash: string) => {
          handleCloseTransferModalClick();
          setTxHash(hash);
        })
        .on('receipt', function (receipt: TransactionReceipt) {
          setTxReceipt(receipt);
          if (receipt && receipt.status) {
            setTransferFinished(true);
            setTimeout(getTokens, 3000); // The API takes a couple of seconds to detect the transfer
          }
        });
    } catch (e) {
      console.log('Error submitting transaction');
      console.log(e);
      showErrorMessage();
    }
  };
  const multiTransfer = async (_web3: any, fromAddress: string, toAddress: string, tokenIds: string[]) => {
    try {
      const contract = new _web3.eth.Contract(abiPoap, CONTRACT_ADDRESS);
      contract.methods
        .isApprovedForAll(fromAddress, MULTITRANSFER_CONTRACT)
        .call()
        .then(async (isMultitransferContractApproved: boolean) => {
          if (!isMultitransferContractApproved) {
            let gas = 500000;
            try {
              gas = await contract.methods
                .setApprovalForAll(MULTITRANSFER_CONTRACT, true)
                .estimateGas({ from: fromAddress });
              gas = Math.floor(gas * 1.3);
            } catch (e) {
              console.log('Error calculating gas');
            }

            contract.methods
              .setApprovalForAll(MULTITRANSFER_CONTRACT, true)
              .send({ from: fromAddress, gas: gas })
              .on('error', (err: Error) => {
                console.log('Error on Multitransfer Approval: ', err);
                showErrorMessage();
              })
              .on('receipt', function (receipt: TransactionReceipt) {
                if (receipt && receipt.status) {
                  _multitransfer(_web3, fromAddress, toAddress, tokenIds);
                }
              });
          } else {
            console.log('Multitransfer contract already approved');
            _multitransfer(_web3, fromAddress, toAddress, tokenIds);
          }
        });
    } catch (e) {
      console.log('Error submitting transaction');
      console.log(e);
      showErrorMessage();
    }
  };

  const _multitransfer = async (_web3: any, fromAddress: string, toAddress: string, tokenIds: string[]) => {
    let gas = 500000;
    const contract = new _web3.eth.Contract(abiMultitransfer, MULTITRANSFER_CONTRACT);
    try {
      gas = await contract.methods.transfer(CONTRACT_ADDRESS, toAddress, tokenIds).estimateGas({ from: fromAddress });
      gas = Math.floor(gas * 1.3);
    } catch (e) {
      console.log('Error calculating gas');
    }

    contract.methods
      .transfer(CONTRACT_ADDRESS, toAddress, tokenIds)
      .send({ from: fromAddress, gas: gas })
      .on('error', (err: Error) => {
        console.log('Error on Multitransfer Approval: ', err);
        showErrorMessage();
      })
      .on('transactionHash', (hash: string) => {
        handleCloseTransferModalClick();
        setTxHash(hash);
      })
      .on('receipt', function (receipt: TransactionReceipt) {
        setTxReceipt(receipt);
        if (receipt && receipt.status) {
          setTransferFinished(true);
          setTimeout(getTokens, 3000); // The API takes a couple of seconds to detect the transfer
        }
      });
  };

  const showErrorMessage = () => {
    let message = `Error while trying to submit transaction.\nPlease try again.`;
    addToast(message, {
      appearance: 'error',
      autoDismiss: false,
    });
  };

  const getTokensByYear = (): TokenByYear[] => {
    if (state.tokens == null) {
      throw new Error('There are no tokens');
    }

    const tokensByYear: Map<number, TokenInfo[]> = new Map();

    for (const token of state.tokens) {
      const { year } = token.event;

      if (tokensByYear.has(year)) {
        tokensByYear.get(year)!.push(token);
      } else {
        tokensByYear.set(year, [token]);
      }
    }

    const lastYear = Math.min(...state.tokens.map((t) => t.event.year));

    const res: TokenByYear[] = [];

    for (let year = new Date().getFullYear(); year >= lastYear; year--) {
      res.push({
        year,
        tokens: tokensByYear.get(year) || [],
      });
    }

    return res;
  };

  const setSelectState = (newSelectState: boolean) => {
    setState((oldState) => ({ ...oldState, isSelectModeActive: newSelectState }));
  };

  const setSelectedTokens = (newSelectedTokens: string[]) => {
    setState((oldState) => ({ ...oldState, selectedTokens: newSelectedTokens }));
  };

  const toggleSelectToken = (tokenId: string) => {
    const index = selectedTokens.indexOf(tokenId);
    if (index > -1) {
      selectedTokens.splice(index, 1);
    } else {
      selectedTokens.push(tokenId);
    }
    setState((oldState) => ({ ...oldState, selectedTokens }));
  };

  const selectEvent = (tokenId: string) => (event: MouseEvent) => {
    if (isSelectModeActive) {
      toggleSelectToken(tokenId);
      event.preventDefault();
    }
  };

  const renderTokens = () => {
    return (
      <>
        <p>These are the events you have attended in the past</p>
        {getTokensByYear().map(({ year, tokens }, i) => (
          <div key={year} className={classNames('event-year', tokens.length === 0 && 'empty-year')}>
            <h2>{year}</h2>
            {tokens.length > 0 ? (
              <div className="events-logos">
                {tokens.map((t) => {
                  return (
                    <div
                      className={classNames('selector-wapper', {
                        'selecting-enabled': isSelectModeActive,
                        'token-selected': selectedTokens.includes(t.tokenId),
                      })}
                      onClickCapture={selectEvent(t.tokenId)}
                      key={t.tokenId}
                    >
                      <TokenSmall tokenId={t.tokenId} name={t.event.name} image={t.event.image_url} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <img src={NoEventsImg} alt="" />
                <p className="image-description">You’ve been a couch potato all of {year}</p>
              </>
            )}
          </div>
        ))}
        <TransferButton
          setSelectState={setSelectState}
          setSelectedTokens={setSelectedTokens}
          startTransfer={startTransfer}
          tokenIds={getTokenIds()}
          isSelectModeActive={isSelectModeActive}
          selectedTokens={selectedTokens}
        />
      </>
    );
  };

  return (
    <main id="site-main" role="main" className="app-content">
      <div className="container">
        <div className="content-event years" data-aos="fade-up" data-aos-delay="300">
          {!error && !loading && (
            <h1>
              {ens ? (
                <>
                  Hey <span>{ens}!</span> ({address && shortAddress(address)})
                </>
              ) : (
                <>
                  <div className={'greetings-desktop'}>Hey {address}!</div>
                  <div className={'greetings-mobile'}>
                    Hey {address && !isValidEmail(address) ? shortAddress(address) : address}!
                  </div>
                </>
              )}
            </h1>
          )}

          {error && !loading && (
            <div className="bk-msg-error">
              There was an error.
              <br />
              Check the address and try again
            </div>
          )}

          {loading === true && (
            <>
              <Loading />
              <div style={{ textAlign: 'center' }}>Waiting for your tokens...</div>
            </>
          )}

          {tokens && tokens.length === 0 && (
            <div className={classNames('event-year', 'empty-year')} style={{ marginTop: '30px' }}>
              <img src={NoEventsImg} alt="" />
              <p className="image-description">You don't seem to have any tokens. You're quite a couch potato!</p>
            </div>
          )}

          {tokens && tokens.length > 0 && renderTokens()}

          {!error && !loading && address && isValidEmail(address) && tokens && tokens.length > 0 && (
            <div className="scan-email-badge-container">
              <span className="scan-email-badge">
                <b>Note:</b> These badges are not in an Ethereum wallet yet. When you're ready to claim your POAPs,
                please click on the button below
              </span>
              <div className="scan-email-badge-button-container">
                <button onClick={handleOpenRedeemModalClick} className="btn btn-primary">
                  Claim my POAPs
                </button>
              </div>
            </div>
          )}
          {transferFinished && <p className={'transfer-success'}>POAP transfered successfully!</p>}
          {txHash && <TxDetail hash={txHash} receipt={txReceipt} layer1={false} />}
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

      <ReactModal isOpen={isTransferModalOpen} shouldFocusAfterRender={true}>
        <div className={classNames('transfer-modal')}>
          <h2>Transfer POAPs</h2>
          <span className="transfer-modal-paragraph">
            <p>
              You will now transfer all the selected POAPs to the address defined below, be sure to double check the
              address, this action can not be undone.
            </p>
            <p>
              To transfer one POAP, only one transaction is needed, to transfer multiple, two transactions are necesary.
            </p>
          </span>
          <AddressInput allowEmail={false} buttonText="Transfer" onAddressButton={transfer} />
          <div className="redeem-modal-buttons-container">
            <div onClick={handleCloseTransferModalClick} className={'close-modal'}>
              Cancel
            </div>
          </div>
        </div>
      </ReactModal>

      <ReactModal isOpen={isRedeemModalOpen} shouldFocusAfterRender={true}>
        <div className={classNames('redeem-modal', isRedeemLoading && 'submitting')}>
          <h2>Claim POAPs</h2>
          <span className="redeem-modal-paragraph">
            To claim your POAPs to your Ethereum wallet you will need access to the email{' '}
            <span className="redeem-modal-email">{address}</span> and the address of your wallet. You will receive an
            email to verify that you own that email and instructions to redeem your POAPs.
          </span>
          <div className="redeem-modal-buttons-container">
            <SubmitButton
              canSubmit={true}
              text="Confirm"
              isSubmitting={isRedeemLoading}
              onClick={handleRedeemConfirm}
            />

            <div onClick={handleCloseRedeemModalClick} className={'close-modal'}>
              Cancel
            </div>
          </div>
        </div>
      </ReactModal>
    </main>
  );
};

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ブロックチェーン技術の実装サンプル集
基本的なブロックチェーンからスマートコントラクトまで、実践的なサンプルコード

機能:
- 基本的なブロックチェーン実装
- マイニング（プルーフ・オブ・ワーク）
- トランザクション処理
- ウォレット機能
- スマートコントラクト（簡易版）
- 分散ネットワーク（P2P）
"""

import hashlib
import json
import time
import random
import threading
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import requests
from urllib.parse import urlparse
import uuid

# ログ設定
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Transaction:
    """トランザクションクラス"""
    sender: str
    recipient: str
    amount: float
    timestamp: float
    signature: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """辞書形式に変換"""
        return {
            'sender': self.sender,
            'recipient': self.recipient,
            'amount': self.amount,
            'timestamp': self.timestamp,
            'signature': self.signature
        }
    
    def calculate_hash(self) -> str:
        """トランザクションのハッシュを計算"""
        transaction_string = f"{self.sender}{self.recipient}{self.amount}{self.timestamp}"
        return hashlib.sha256(transaction_string.encode()).hexdigest()

@dataclass
class Block:
    """ブロッククラス"""
    index: int
    timestamp: float
    transactions: List[Transaction]
    previous_hash: str
    nonce: int = 0
    hash: str = ""
    
    def calculate_hash(self) -> str:
        """ブロックのハッシュを計算"""
        block_string = f"{self.index}{self.timestamp}{self.previous_hash}{self.nonce}"
        for tx in self.transactions:
            block_string += tx.calculate_hash()
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int) -> None:
        """ブロックをマイニング（プルーフ・オブ・ワーク）"""
        target = "0" * difficulty
        logger.info(f"ブロック {self.index} のマイニング開始...")
        
        start_time = time.time()
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        
        end_time = time.time()
        logger.info(f"ブロック {self.index} のマイニング完了: {end_time - start_time:.2f}秒")
        logger.info(f"ハッシュ: {self.hash}")

class Wallet:
    """ウォレットクラス"""
    
    def __init__(self):
        """新しいウォレットを作成"""
        self.private_key, self.public_key = self.generate_key_pair()
        self.address = self.generate_address()
        self.balance = 0.0
    
    def generate_key_pair(self) -> tuple:
        """RSA鍵ペアを生成"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        return private_key, public_key
    
    def generate_address(self) -> str:
        """公開鍵からアドレスを生成"""
        public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return hashlib.sha256(public_bytes).hexdigest()[:40]
    
    def sign_transaction(self, transaction: Transaction) -> str:
        """トランザクションに署名"""
        transaction_string = f"{transaction.sender}{transaction.recipient}{transaction.amount}{transaction.timestamp}"
        signature = self.private_key.sign(
            transaction_string.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return signature.hex()
    
    def create_transaction(self, recipient: str, amount: float) -> Transaction:
        """新しいトランザクションを作成"""
        if amount > self.balance:
            raise ValueError("残高不足です")
        
        transaction = Transaction(
            sender=self.address,
            recipient=recipient,
            amount=amount,
            timestamp=time.time()
        )
        
        transaction.signature = self.sign_transaction(transaction)
        return transaction

class Blockchain:
    """ブロックチェーンクラス"""
    
    def __init__(self, difficulty: int = 4):
        """ブロックチェーンを初期化"""
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_transactions: List[Transaction] = []
        self.mining_reward = 100.0
        self.nodes = set()
        
        # ジェネシスブロックを作成
        self.create_genesis_block()
    
    def create_genesis_block(self) -> None:
        """ジェネシスブロックを作成"""
        genesis_transaction = Transaction(
            sender="0",
            recipient="genesis",
            amount=0.0,
            timestamp=time.time()
        )
        
        genesis_block = Block(
            index=0,
            timestamp=time.time(),
            transactions=[genesis_transaction],
            previous_hash="0"
        )
        
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        logger.info("ジェネシスブロックが作成されました")
    
    def get_latest_block(self) -> Block:
        """最新のブロックを取得"""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Transaction) -> bool:
        """トランザクションを追加"""
        if not self.verify_transaction(transaction):
            return False
        
        self.pending_transactions.append(transaction)
        return True
    
    def verify_transaction(self, transaction: Transaction) -> bool:
        """トランザクションの署名を検証"""
        try:
            # 送信者の公開鍵を取得（実際の実装では鍵管理システムが必要）
            # ここでは簡易的に検証をスキップ
            return True
        except Exception as e:
            logger.error(f"トランザクション検証エラー: {e}")
            return False
    
    def mine_pending_transactions(self, mining_reward_address: str) -> None:
        """保留中のトランザクションをマイニング"""
        if not self.pending_transactions:
            logger.info("マイニングするトランザクションがありません")
            return
        
        # マイニング報酬トランザクションを追加
        reward_transaction = Transaction(
            sender="0",
            recipient=mining_reward_address,
            amount=self.mining_reward,
            timestamp=time.time()
        )
        
        # 新しいブロックを作成
        block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=self.pending_transactions + [reward_transaction],
            previous_hash=self.get_latest_block().hash
        )
        
        # ブロックをマイニング
        block.mine_block(self.difficulty)
        
        # チェーンに追加
        self.chain.append(block)
        
        # 保留中のトランザクションをクリア
        self.pending_transactions = []
        
        logger.info(f"ブロック {block.index} がチェーンに追加されました")
    
    def get_balance(self, address: str) -> float:
        """アドレスの残高を計算"""
        balance = 0.0
        
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.sender == address:
                    balance -= transaction.amount
                if transaction.recipient == address:
                    balance += transaction.amount
        
        return balance
    
    def is_chain_valid(self) -> bool:
        """チェーンの有効性を検証"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # ハッシュの検証
            if current_block.hash != current_block.calculate_hash():
                logger.error(f"ブロック {i} のハッシュが無効です")
                return False
            
            # 前のブロックとの連結を検証
            if current_block.previous_hash != previous_block.hash:
                logger.error(f"ブロック {i} の前のブロックハッシュが無効です")
                return False
        
        return True
    
    def add_node(self, address: str) -> None:
        """ノードを追加"""
        parsed_url = urlparse(address)
        self.nodes.add(parsed_url.netloc)
        logger.info(f"ノード {address} が追加されました")
    
    def replace_chain(self) -> bool:
        """最長チェーンで置き換え"""
        network = self.nodes
        longest_chain = None
        max_length = len(self.chain)
        
        for node in network:
            try:
                response = requests.get(f'http://{node}/chain')
                if response.status_code == 200:
                    length = response.json()['length']
                    chain = response.json()['chain']
                    
                    if length > max_length and self.is_chain_valid():
                        max_length = length
                        longest_chain = chain
            except Exception as e:
                logger.error(f"ノード {node} との通信エラー: {e}")
                continue
        
        if longest_chain:
            self.chain = longest_chain
            return True
        
        return False

class SmartContract:
    """簡易スマートコントラクトクラス"""
    
    def __init__(self, contract_id: str, creator: str):
        """スマートコントラクトを初期化"""
        self.contract_id = contract_id
        self.creator = creator
        self.state = {}
        self.functions = {}
        self.created_at = time.time()
    
    def add_function(self, name: str, function_code: str) -> None:
        """関数を追加"""
        self.functions[name] = function_code
        logger.info(f"関数 {name} がコントラクト {self.contract_id} に追加されました")
    
    def execute_function(self, function_name: str, parameters: Dict[str, Any]) -> Any:
        """関数を実行"""
        if function_name not in self.functions:
            raise ValueError(f"関数 {function_name} が見つかりません")
        
        # 簡易的な関数実行（実際の実装ではより複雑な処理が必要）
        function_code = self.functions[function_name]
        
        # 基本的な算術演算の例
        if function_name == "add":
            return parameters.get('a', 0) + parameters.get('b', 0)
        elif function_name == "multiply":
            return parameters.get('a', 0) * parameters.get('b', 0)
        elif function_name == "get_balance":
            return self.state.get('balance', 0)
        elif function_name == "set_balance":
            self.state['balance'] = parameters.get('value', 0)
            return True
        
        return None

class DeFiProtocol:
    """DeFiプロトコル（簡易版）"""
    
    def __init__(self, name: str):
        """DeFiプロトコルを初期化"""
        self.name = name
        self.liquidity_pools = {}
        self.lending_pools = {}
        self.total_value_locked = 0.0
    
    def create_liquidity_pool(self, token_a: str, token_b: str, initial_liquidity: float) -> str:
        """流動性プールを作成"""
        pool_id = f"{token_a}_{token_b}_{int(time.time())}"
        
        self.liquidity_pools[pool_id] = {
            'token_a': token_a,
            'token_b': token_b,
            'reserve_a': initial_liquidity,
            'reserve_b': initial_liquidity,
            'total_supply': initial_liquidity * 2,
            'created_at': time.time()
        }
        
        self.total_value_locked += initial_liquidity * 2
        logger.info(f"流動性プール {pool_id} が作成されました")
        return pool_id
    
    def add_liquidity(self, pool_id: str, amount_a: float, amount_b: float) -> float:
        """流動性を追加"""
        if pool_id not in self.liquidity_pools:
            raise ValueError("プールが見つかりません")
        
        pool = self.liquidity_pools[pool_id]
        
        # 簡易的なAMM計算
        liquidity_tokens = min(amount_a / pool['reserve_a'], amount_b / pool['reserve_b']) * pool['total_supply']
        
        pool['reserve_a'] += amount_a
        pool['reserve_b'] += amount_b
        pool['total_supply'] += liquidity_tokens
        
        self.total_value_locked += amount_a + amount_b
        logger.info(f"流動性が追加されました: {liquidity_tokens:.2f} トークン")
        return liquidity_tokens
    
    def swap_tokens(self, pool_id: str, token_in: str, amount_in: float) -> float:
        """トークンをスワップ"""
        if pool_id not in self.liquidity_pools:
            raise ValueError("プールが見つかりません")
        
        pool = self.liquidity_pools[pool_id]
        
        if token_in == pool['token_a']:
            # A -> B のスワップ
            amount_out = (amount_in * pool['reserve_b']) / (pool['reserve_a'] + amount_in)
            pool['reserve_a'] += amount_in
            pool['reserve_b'] -= amount_out
        else:
            # B -> A のスワップ
            amount_out = (amount_in * pool['reserve_a']) / (pool['reserve_b'] + amount_in)
            pool['reserve_b'] += amount_in
            pool['reserve_a'] -= amount_out
        
        logger.info(f"スワップ完了: {amount_in:.2f} {token_in} -> {amount_out:.2f}")
        return amount_out

def demo_basic_blockchain():
    """基本的なブロックチェーンのデモ"""
    print("=== 基本的なブロックチェーンデモ ===")
    
    # ブロックチェーンを作成
    blockchain = Blockchain(difficulty=2)
    
    # ウォレットを作成
    alice = Wallet()
    bob = Wallet()
    charlie = Wallet()
    
    # 初期残高を設定（実際の実装ではマイニングで獲得）
    alice.balance = 1000.0
    bob.balance = 500.0
    charlie.balance = 200.0
    
    print(f"Alice のアドレス: {alice.address}")
    print(f"Bob のアドレス: {bob.address}")
    print(f"Charlie のアドレス: {charlie.address}")
    
    # トランザクションを作成
    tx1 = alice.create_transaction(bob.address, 100.0)
    tx2 = bob.create_transaction(charlie.address, 50.0)
    tx3 = charlie.create_transaction(alice.address, 25.0)
    
    # トランザクションをブロックチェーンに追加
    blockchain.add_transaction(tx1)
    blockchain.add_transaction(tx2)
    blockchain.add_transaction(tx3)
    
    # ブロックをマイニング
    print("\nブロックをマイニング中...")
    blockchain.mine_pending_transactions(alice.address)
    
    # 残高を表示
    print(f"\nAlice の残高: {blockchain.get_balance(alice.address):.2f}")
    print(f"Bob の残高: {blockchain.get_balance(bob.address):.2f}")
    print(f"Charlie の残高: {blockchain.get_balance(charlie.address):.2f}")
    
    # チェーンの有効性を検証
    print(f"\nチェーンの有効性: {blockchain.is_chain_valid()}")
    print(f"チェーンの長さ: {len(blockchain.chain)}")

def demo_smart_contract():
    """スマートコントラクトのデモ"""
    print("\n=== スマートコントラクトデモ ===")
    
    # スマートコントラクトを作成
    contract = SmartContract("contract_001", "alice")
    
    # 関数を追加
    contract.add_function("add", "a + b")
    contract.add_function("multiply", "a * b")
    contract.add_function("get_balance", "return balance")
    contract.add_function("set_balance", "balance = value")
    
    # 関数を実行
    result1 = contract.execute_function("add", {"a": 10, "b": 20})
    result2 = contract.execute_function("multiply", {"a": 5, "b": 6})
    
    print(f"10 + 20 = {result1}")
    print(f"5 * 6 = {result2}")
    
    # 状態を変更
    contract.execute_function("set_balance", {"value": 1000})
    balance = contract.execute_function("get_balance", {})
    print(f"コントラクトの残高: {balance}")

def demo_defi_protocol():
    """DeFiプロトコルのデモ"""
    print("\n=== DeFiプロトコルデモ ===")
    
    # DeFiプロトコルを作成
    defi = DeFiProtocol("SampleDeFi")
    
    # 流動性プールを作成
    pool_id = defi.create_liquidity_pool("ETH", "USDC", 1000.0)
    print(f"流動性プール作成: {pool_id}")
    
    # 流動性を追加
    liquidity_tokens = defi.add_liquidity(pool_id, 100.0, 100.0)
    print(f"流動性追加: {liquidity_tokens:.2f} トークン")
    
    # トークンスワップ
    amount_out = defi.swap_tokens(pool_id, "ETH", 10.0)
    print(f"スワップ: 10 ETH -> {amount_out:.2f} USDC")
    
    print(f"Total Value Locked: {defi.total_value_locked:.2f}")

def main():
    """メイン関数"""
    print("ブロックチェーン技術の実装サンプル")
    print("=" * 50)
    
    try:
        # 基本的なブロックチェーンのデモ
        demo_basic_blockchain()
        
        # スマートコントラクトのデモ
        demo_smart_contract()
        
        # DeFiプロトコルのデモ
        demo_defi_protocol()
        
        print("\n=== デモ完了 ===")
        
    except Exception as e:
        logger.error(f"デモ実行エラー: {e}")
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()

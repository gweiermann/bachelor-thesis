struct BinaryTreeNode {
    int data;
    BinaryTreeNode* left;
    BinaryTreeNode* right;
};

void insert(BinaryTreeNode*& node, int value);

void insertMyself(BinaryTreeNode*& root, int value) {
    if (root == nullptr) {
        root = new BinaryTreeNode{value, nullptr, nullptr};
    } else if (value < root->data) {
        insertMyself(root->left, value);
    } else {
        insertMyself(root->right, value);
    }
}

void insert(BinaryTreeNode*& node, int value);

int main() {
    BinaryTreeNode* root = nullptr;
    insertMyself(root, 5);
    insertMyself(root, 3);
    insertMyself(root, 7);
    insert(root, 2);
    insert(root, 4);
    insert(root, 6);
    insert(root, 8);
    return 0;
}
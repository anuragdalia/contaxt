# Contaxt

Contaxt is a powerful tool designed to enhance your interaction with your local Git repository. By leveraging the OpenAI
API, Contaxt provides insightful assistance for understanding and managing your codebase effectively. Key features
include repository indexing, file change monitoring, and intelligent querying of your code.

## Features

- **Repository Indexing:** Quickly and efficiently index your local Git repository for easy search and retrieval.
- **File Change Monitoring:** Keep track of file changes in your repository and update the index automatically.
- **Intelligent Querying:** Get concise and relevant responses to your queries about the codebase.
- **File Hashing:** Identify changes and avoid redundant indexing by computing and storing file hashes.

## Usage [in dev]
```shell
git clone https://github.com/anuragdalia/contaxt.git
$ yarn install
$ export OPENAI_API_KEY=...
$ ts-node src/index.ts 
# pass the repo and wait for indexing to happen
# query your code 
```

## Tasks
- [ ] Filter vectra results for chunks or files only
- [ ] Chain queries to get more intelligent results
- [ ] Optimise indexing speed by parallel processing [upto 4 files]
- [ ] Add more models support via adapter pattern
- [ ] ???

## Support

I invite the community to contribute and support the development of Contaxt. Your contributions can help make this tool
even better. Please fork the repository and submit pull requests for enhancements or bug fixes. For any questions or
issues, feel free to open an issue on our GitHub repository.

---

Contaxt aims to make managing and understanding your codebase easier and more efficient. Your support and contributions
are highly appreciated. Happy coding!

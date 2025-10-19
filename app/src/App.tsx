import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { CreateVault } from "./components/CreateVault";
import { VaultList } from "./components/VaultList";

function App() {
  const account = useCurrentAccount();

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>TGE DeFi - DCA Vault</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {!account ? (
            <Box className="text-center py-8">
              <Heading size="4" mb="4">
                Welcome to TGE DeFi DCA Vault
              </Heading>
              <p className="text-gray-400">
                Connect your wallet to create and manage DCA vaults
              </p>
            </Box>
          ) : (
            <div className="space-y-6">
              <CreateVault />
              <VaultList />
            </div>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;

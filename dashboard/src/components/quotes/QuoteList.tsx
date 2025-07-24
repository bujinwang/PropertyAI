import React, { useState, useEffect } from 'react';
import { Box, Text, Button, VStack, HStack, Divider, useToast } from '@chakra-ui/react';
import { getQuotesForWorkOrder, approveQuote, rejectQuote } from '../../services/manager.api';

const QuoteList = ({ workOrderId }) => {
  const [quotes, setQuotes] = useState([]);
  const toast = useToast();

  const fetchQuotes = async () => {
    try {
      const response = await getQuotesForWorkOrder(workOrderId);
      setQuotes(response.data);
    } catch (error) {
      toast({ title: 'Error fetching quotes', status: 'error', duration: 3000, isClosable: true });
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [workOrderId]);

  const handleApprove = async (quoteId) => {
    try {
      await approveQuote(quoteId);
      toast({ title: 'Quote approved', status: 'success', duration: 3000, isClosable: true });
      fetchQuotes(); // Refresh the list
    } catch (error) {
      toast({ title: 'Error approving quote', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await rejectQuote(quoteId);
      toast({ title: 'Quote rejected', status: 'success', duration: 3000, isClosable: true });
      fetchQuotes(); // Refresh the list
    } catch (error) {
      toast({ title: 'Error rejecting quote', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box mt={8}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>Quotes</Text>
      <VStack divider={<Divider />} spacing={4} align="stretch">
        {quotes.map((quote) => (
          <Box key={quote.id} p={4} borderWidth="1px" borderRadius="md" opacity={quote.status !== 'PENDING' ? 0.5 : 1}>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">{quote.vendor.name}</Text>
              <Text fontSize="lg" fontWeight="bold">${quote.amount.toFixed(2)}</Text>
            </HStack>
            <Text mt={2} color="gray.600">{quote.details}</Text>
            <HStack mt={4} spacing={4}>
              <Button colorScheme="green" size="sm" onClick={() => handleApprove(quote.id)} isDisabled={quote.status !== 'PENDING'}>Approve</Button>
              <Button colorScheme="red" size="sm" onClick={() => handleReject(quote.id)} isDisabled={quote.status !== 'PENDING'}>Reject</Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default QuoteList;